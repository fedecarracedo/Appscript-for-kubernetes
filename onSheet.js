function onOpen() {
  SpreadsheetApp.getUi().createMenu("Test")
  .addItem("Config credentials", "saveCredentials")
  .addItem("List clusters", "processClusters")
  .addToUi()
}
/*
  TO DO:
    - Manejo de errores
    - JSDOC para funciones de primer nivel
 */

// function main() {
//   let clusterIp = AKI.getGoogleClusterIp("testing-new-things-378201", "hello-cluster")
//   let k8v1api = new AKI.createK8V1Api(KUBE_TOKEN, clusterIp)
//   let Pods = k8v1api.pods

//   Logger.log(Pods.list())

// }

function processClusters() {
  const documentProperties = PropertiesService.getDocumentProperties();
  const KUBE_TOKEN = documentProperties.getProperty("KUBE_TOKEN")
  const CLUSTER_IP = documentProperties.getProperty("CLUSTER_IP")

  if(!KUBE_TOKEN || !CLUSTER_IP) saveCredentials()

  const deployments = getDeployments()
  let namespaces = [... new Set(deployments.map((deployment) => deployment.namespace))]

  const deploymentsByNamespace = separateDeploymentsByNamespace(namespaces, deployments)

  setNamespaceSheets(deploymentsByNamespace)

}

// Given an array of namespaces, creates a sheet for every namespace and lists the corresponding pods.
function setNamespaceSheets(deploymentsByNamespace) {
  let ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheets = ss.getSheets()

  deploymentsByNamespace.forEach((group) => {
    let i = 0
    let found = false
    while(i < sheets.length && !found) {
      let currSheet = sheets[i].getName()
      if(currSheet == group.namespace) found = true
      i++
    }

    if(!found) {
      const newSheet = ss.insertSheet().setName(group.namespace)
      let rows = group.deployments.map((deployment) => {
        return [deployment.name, "" , deployment.replicas]
      })
      rows.unshift(["Deployment name", "Desired replicas", "Actual replicas"])
      newSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows)
    } 


  })
}

// Takes the array of every namespace available and groups the deployments accordingly
function separateDeploymentsByNamespace(namespaces, deployments) {
  let deploymentsByNamespace = namespaces.map((namespace) => {
    let thisNamespaceDeployments = []
    deployments.forEach((deployment) => deployment.namespace == namespace ? thisNamespaceDeployments.push(deployment) : "")
    return {
      namespace: namespace,
      deployments: thisNamespaceDeployments
    }
  })
  return deploymentsByNamespace
}


function listDeployments() {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kubesheets")
  if(ss) {
    let deployments = getDeployments()
    let rows = deployments.map((deployment) => {
      return [deployment.name, "" , deployment.replicas]
    })
    rows.unshift(["Deployment name", "Desired replicas", "Actual replicas"])
    ss.getRange(5, 1, rows.length, rows[0].length).setValues(rows)
  } else {
    createConfigSheet()
  }
}

// Checks if the user is asking to create replicas and handles the task.
function checkReplicaRequests() {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kubesheets")
  let ssData = ss.getDataRange().getValues()

  for(let i = 5; i < ssData.length; i++) {
    let desiredReplicas = ssData[i][1]
    if(desiredReplicas) {
      let deploymentName = ssData[i][0]
      Logger.log("Detected desired replicas for: " + deploymentName + " Number: " + desiredReplicas	)
      let env = getEnv()
      const k8v1api = new AKI.createK8V1Api(env.kube_token, env.public_ip)
      const Deployments = k8v1api.deployments
      Deployments.update_replicas("default", deploymentName, desiredReplicas)

      ss.getRange(i+1, 2).setValue("")
      Utilities.sleep(5000)
      listDeployments()
    }
  }
}

// Gets every deployment in the cluster
function getDeployments() {
  const documentProperties = PropertiesService.getDocumentProperties();
  const KUBE_TOKEN = documentProperties.getProperty("KUBE_TOKEN")
  const CLUSTER_IP = documentProperties.getProperty("CLUSTER_IP")

  if(KUBE_TOKEN && CLUSTER_IP) {
    const k8v1api = new AKI.createK8V1Api(KUBE_TOKEN, CLUSTER_IP)
    const Deployments = k8v1api.deployments
    let deploymentList = JSON.parse(Deployments.listAll()).items

    let userDeployments = deploymentList.filter((deployment) => deployment.metadata.namespace !== "kube-system")

    let deploymentData = userDeployments.map((deployment) => {
      return {
        name: deployment.metadata.name,
        namespace: deployment.metadata.namespace,
        replicas: deployment.spec.replicas
      }
    })

    Logger.log(deploymentData)
    return deploymentData
  }
}





function saveCredentials() {
  const scriptProperties = PropertiesService.getScriptProperties();
  var ui = SpreadsheetApp.getUi();
  var cluster_ip_response = ui.prompt('Insert cluster IP adress',"Your cluster IP is", ui.ButtonSet.OK_CANCEL);
  scriptProperties.setProperty("CLUSTER_IP", cluster_ip_response.getResponseText())

  var kube_token_response = ui.prompt('Insert your Kube-token',"Your cluster Kubernetes token is", ui.ButtonSet.OK_CANCEL);
  scriptProperties.setProperty("KUBE_TOKEN", kube_token_response.getResponseText())
}




// function testing() {
//   const scriptProperties = PropertiesService.getScriptProperties();
//   const KUBE_TOKEN = scriptProperties.getProperty("KUBE_TOKEN")
//   const CLUSTER_IP = scriptProperties.getProperty("CLUSTER_IP")

//   let deployments = getDeployments()
//   let userDeployments = deployments.filter((deployment) => deployment.namespace !== "kube-system")
//   let namespaces = [... new Set(userDeployments.map((deployment) => deployment.namespace))]

//   const k8v1api = new AKI.createK8V1Api(KUBE_TOKEN, CLUSTER_IP)
//   const Deployments = k8v1api.deployments
//   namespaces.forEach((namespace) => { Logger.log(Deployments.listFromNamespace(namespace))})
// }




