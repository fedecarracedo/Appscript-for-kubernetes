

// function main() {
//   let clusterIp = AKI.getGoogleClusterIp("testing-new-things-378201", "hello-cluster")
//   let k8v1api = new AKI.createK8V1Api(KUBE_TOKEN, clusterIp)
//   let Pods = k8v1api.pods

//   Logger.log(Pods.list())

// }

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
  
  function getDeployments() {
    let env = getEnv()
  
    if(env) {
      const k8v1api = new AKI.createK8V1Api(env.kube_token, env.public_ip)
      const Deployments = k8v1api.deployments
      let deploymentList = JSON.parse(Deployments.list("default")).items
  
      let deploymentData = deploymentList.map((deployment) => {
        return {
          name: deployment.metadata.name,
          replicas: deployment.spec.replicas
        }
      })
      return deploymentData
    }
  }
  
  function getEnv() {
    let ss = createConfigSheet()
  
    let KUBE_TOKEN = ss.getRange(1,2).getValue().toString()
    let PUBLIC_IP = ss.getRange(2,2).getValue().toString()
    if(KUBE_TOKEN && PUBLIC_IP) 
      return {
        kube_token: KUBE_TOKEN,
        public_ip: PUBLIC_IP
      }
    else {
      Logger.log("Complete las variables de entorno.")
      return {}
    }
  }
  
  function createConfigSheet() {
    let ss = SpreadsheetApp.getActiveSpreadsheet()
    let sheets = ss.getSheets()
  
    let i = 0
    let found = false
    while(i < sheets.length && !found) {
      let sheetName = sheets[i].getName()
      if(sheetName == "Kubesheets") found = true
      i++
    }
  
    if(!found) {
      ss.insertSheet().setName("Kubesheets")
      let kubesheet = ss.getSheetByName("Kubesheets")
      kubesheet.getRange(1,1).setValue("KUBE TOKEN")
      kubesheet.getRange(2,1).setValue("PUBLIC IP")
      return kubesheet
    } else 
      return ss.getSheetByName("Kubesheets")
  
  }