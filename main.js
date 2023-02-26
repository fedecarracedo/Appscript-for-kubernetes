// http://127.0.0.1:8001/api/v1/pods

const KUBE_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ5Q0xqUDd5ZV9HaGZjZ3ZZUHg3U0FBaUcxdnVxV0tCTGxqYW1aNjVaRlUifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImRlZmF1bHQtdG9rZW4iLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGVmYXVsdCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjhiM2VhZjJjLWM0NDQtNGJhOS1hOGY2LWFjY2VkY2VmYTg5ZSIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmRlZmF1bHQifQ.e_s-QCqr_v6Dk-lBPshdJfieGBV3cj1wacznRl-G4oo0PEW3Oy9M4gDgOQFTPYwMM3qKpRSjWImfNFjiv-jqXdG73bSQiqEFI8gKRqmCaq4bNPx5wP-cy9erAT6a2wI3S4f9J_RwmRcqq1FAIWN9k7epkAuUw3CEGthbGo1X6B8z2Wrl-0kBIlny4nTw08bJkeJ5K95I-nUhyAxSg8HF0TMZLz4SUJM-lwWFkOHMJXuFhBTulG60pzSeCJ7UOoAByX9ROLcB8veGNE7RZu1Xzg-2x4zXaXlrhXhlVV5KvNJj1vHuZ6lqlQIvcd9niThL-tQPuoHbETADtjiv_vJ_Cg"

class API_ENDPOINT {
  constructor(kube_token, public_adress) {
    this.KUBE_TOKEN = kube_token
    this.PUBLIC_ADRESS = public_adress
  }
}

class k8V1Api extends API_ENDPOINT {
    get pods() {
      return new PodsAPI(this.KUBE_TOKEN, this.PUBLIC_ADRESS)
    }
}

class PodsAPI extends API_ENDPOINT  {
  list() {
    let response = UrlFetchApp.fetch(`https://${this.PUBLIC_ADRESS}/api/v1/pods`, {"headers": {
      Authorization: 'Bearer ' + this.KUBE_TOKEN
    }, validateHttpsCertificates: false, muteHttpExceptions: true})
    return response
  }
  
}

// TEST MAIN FUNCTION

async function main() {
    let clusterIp = getGoogleClusterIp("testing-new-things-378201", "hello-cluster")

    let k8API = new k8V1Api(KUBE_TOKEN, clusterIp)
    let Pods = k8API.pods

    Logger.log(Pods.list())
}

// TEST MAIN FUNCTION

/**
 * @param {string} project_id The ID of the Google Cloud Project
 * @param {string} cluster_name The name of the GKE Cluster
 */
function getGoogleClusterIp(project_id, cluster_name) {
  try {
    const ACCESS_TOKEN = ScriptApp.getOAuthToken()
    let kubeApiUrl = `https://container.googleapis.com/v1beta1/projects/${project_id}/locations/-/clusters/`
    let clusterResponse = UrlFetchApp.fetch(kubeApiUrl, { 
      headers: { Authorization: 'Bearer ' + ACCESS_TOKEN }
    })

    let clusterResponseObj = JSON.parse(clusterResponse)
    let cluster = clusterResponseObj.clusters.find((el) => el.name == cluster_name)

    if(cluster)
      return cluster.privateClusterConfig.publicEndpoint
    else
      throw("Could not find a cluster with the name '" + cluster_name + "'.")

  } catch(e) {
    Logger.log(e)
  }
}










