class GitServer {
  constructor(type, token) {
    this.type = type;
    this.token = token;
  }
  setToken(token) {
    this.token = token;
  }
  createRepo() {
    error("createRepo");
  }

  createOrgRepo() {
    error("createOrgRepo");
  }

  getRemote() {
    error("getRemote");
  }
  getuser() {
    error("getuser");
  }
  getOrg() {
    error("getOrg");
  }
  getRepo(login, name) {
    error("getRepo");
  }

  getTokenUrl() {
    error("getTokenUrl");
  }

  getTokenHelpUrl() {
    error("getTokenHelpUrl");
  }

  isHttpResponse = (response) => {
    return response && response.status;
  };

  handleResponse = (response) => {
    if (this.isHttpResponse(response) && response !== 200) {
      return null;
    } else {
      return response;
    }
  };
}

module.exports = GitServer;
