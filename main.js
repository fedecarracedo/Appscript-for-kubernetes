class API_ENDPOINT {
    constructor(kube_token, public_adress) {
      this.KUBE_TOKEN = kube_token
      this.PUBLIC_ADRESS = public_adress
    }
  
    api_request(route, extra_params = {}) {
      let base_params = {
        "headers": {
          Authorization: 'Bearer ' + this.KUBE_TOKEN
        }, validateHttpsCertificates: false, muteHttpExceptions: true
      }
      let params = {...base_params, ...extra_params}
      let response = UrlFetchApp.fetch(`https://${this.PUBLIC_ADRESS}${route}`, params)
      return response
    }
  }
  
  class K8V1Api extends API_ENDPOINT {
      get pods() {
        return new PodsAPI(this.KUBE_TOKEN, this.PUBLIC_ADRESS)
      }
      get deployments() {
        return new DeploymentsAPI(this.KUBE_TOKEN, this.PUBLIC_ADRESS)
      }
  }
  
  class DeploymentsAPI extends API_ENDPOINT {
    list(namespace) {
      return this.api_request(`/apis/apps/v1/namespaces/${namespace}/deployments/`)
    }
  
    update_replicas(namespace, deployment_name, replicas) {
      let body = JSON.stringify({ 'spec': { 'replicas': replicas } })
      let extra_params = {
        method: 'PATCH',
        payload: body,
        headers: {
          'Authorization': 'Bearer ' + this.KUBE_TOKEN,
          'Content-Type': 'application/strategic-merge-patch+json',
        },
      }
      let response = this.api_request(`/apis/apps/v1/namespaces/${namespace}/deployments/${deployment_name}`, extra_params)
      return response
    }
  }
  
  class PodsAPI extends API_ENDPOINT  {
    list() {
      return this.api_request("/api/v1/pods")
    }
  
  }
  
  
  /**
   * @param {string} project_id The ID of the Google Cloud Project
   * @param {string} cluster_name The name of the GKE Cluster
   */
  function getGoogleClusterIp(project_id, cluster_name) {
    try {
      const ACCESS_TOKEN = ScriptApp.getOAuthToken()
      let kubeApiUrl = `https://container.googleapis.com/v1beta1/projects/${project_id}/locations/-/clusters/`
      let clusterResponse = UrlFetchApp.fetch(kubeApiUrl, { 
        headers: { Authorization: 'Bearer ' + ACCESS_TOKEN },
        muteHttpExceptions: true
      })
  
      let clusterResponseObj = JSON.parse(clusterResponse)
      let cluster = clusterResponseObj.clusters.find((el) => el.name == cluster_name)
  
      if(cluster) {
          Logger.log(cluster.privateClusterConfig.publicEndpoint)
          return cluster.privateClusterConfig.publicEndpoint
  
      }
      else
        throw("Could not find a cluster with the name '" + cluster_name + "'.")
  
    } catch(e) {
      Logger.log(e)
    }
  }
  
  function createK8V1Api(kube_token, public_adress) {
    return new K8V1Api(kube_token, public_adress)
  }
  
  
  
  // TEST MAIN FUNCTION
  
  // async function main() {
  //     let clusterIp = getGoogleClusterIp("testing-new-things-378201", "hello-cluster")
  
  //     let k8API = new K8V1Api(KUBE_TOKEN, clusterIp)
  //     let Pods = k8API.pods
  //     let Deployments = k8API.deployments
  
  //     Logger.log(Deployments.update_replicas("default", "knote", 1))
  // }
  
  // TEST MAIN FUNCTION
  
  
  
  
  
  
  
  