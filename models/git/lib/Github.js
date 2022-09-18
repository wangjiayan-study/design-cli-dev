const GitServer = require("./GitServer");
const GithubRequest = require("./GithubRequest");
class Github extends GitServer {
  constructor(token) {
    super("github");
  }

  setToken(token) {
    super.setToken(token);
    this.token = token;
    this.request = new GithubRequest(token);
  }

  getUser() {
    return this.request.get("/user");
  }

  getOrg() {
    return this.request.get(`/user/orgs`, {
      page: 1,
      per_page: 100,
    });
  }

  getRepo(login, name) {
    return this.request.get(`/repos/${login}/${name}`).then((response) => {
      return this.handleResponse(response);
    });
  }

  createRepo(name) {
    return this.request.post(
      "/user/repos",
      {
        name,
      },
      {
        Accept: "application/vnd.github.v3+json",
      }
    );
  }

  createOrgRepo(name, login) {
    return this.request.post(
      `/orgs/${login}/repos`,
      {
        name,
      },
      {
        Accept: "application/vnd.github.v3+json",
      }
    );
  }

  getRemote(login, name) {
    return `https://github.com/${login}/${name}.git`;
  }
  getTokenUrl() {
    return "https://github.com/settings/tokens";
  }
}

module.exports = Github;
