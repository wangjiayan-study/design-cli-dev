const GitServer = require("./GitServer");
class Gitee extends GitServer {
  constructor(token) {
    super("Gitee");
  }

  setToken(token) {
    this.token = token;
  }

  createRepo() {}

  createOrgRepo() {}

  getRemote() {}
  getuser() {}
  getOrg() {}
  getTokenUrl() {
    return "https://gitee.com/personal_access_tokens";
  }
}

module.exports = Gitee;
