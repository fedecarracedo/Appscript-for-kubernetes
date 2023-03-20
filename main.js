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
  listFromNamespace(namespace) {
    return this.api_request(`/apis/apps/v1/namespaces/${namespace}/deployments/`)
  }
  
  listAll() {
    return this.api_request("/apis/apps/v1/deployments")
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
//     let clusterIp = getGoogleClusterIp("testing-new-things-378201", "nuevo-cluster")
//     const KUBE_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkRHQ2xYRHhONTJ4UGdPZUxkbmlqa05vSmZMRDNrbmMteXBObU1tMkdid2sifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImRlZmF1bHQtdG9rZW4iLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGVmYXVsdCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjZjY2JkYTM5LWViNzgtNGRjOC04MzU4LTFiYzM3ZDQ4ZmQ1ZSIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmRlZmF1bHQifQ.ap_JrY1pP6yDrnzJ_rz2RG-ir0dmxXPG2_3XoHQDLI3UtpopHx1-t5nA0FllcwGv6lrIb-qdiClR9XDNYSxYNTXDAK45YPu6kmE_DKM0-gaCCKJzd0v2GNtFOYcgXR0H095I_TsR2it0p8Qoqq2vDhJ3af765stau-cLbzvlQKwQ6XJZjsazrmDNvAHshCDkahEsXMFABDUi695mJdoZt58SL4kvRz_DpDrYsD6jWH1K56-o_gMSpwQ7susNqrRIZV3QRNXIBd9vOjx3ZWp6DAzc6oYiZ7jRH1yjxvQ652M3uny_fWBuOTTLxqPXAcofpAazT7JMOUSuz7fV8SavcA"
//     let k8api = new K8V1Api(KUBE_TOKEN, clusterIp)
//     let response = JSON.parse(k8api.api_request("/apis/apps/v1/deployments"))
//     response.items.forEach((deployment) => deployment.metadata.namespace !== "kube-system" ? Logger.log(deployment.metadata.namespace) : "")
// }

// TEST MAIN FUNCTION







