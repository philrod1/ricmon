const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

module.exports = {

  getJSON: (url, auth, method) => {
    return new Promise( (resolve, reject) => {
      const agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36";
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhr.setRequestHeader("user-agent", agent);
      xhr.setRequestHeader("Authorization", auth);
      xhr.onload = function () {
        const status = xhr.status;
        if (status == 200) {
          resolve(xhr.responseText);
        } else {
          reject(status);
        }
      };
      xhr.send();
    });
  }

}

