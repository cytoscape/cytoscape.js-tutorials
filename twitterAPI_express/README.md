# Twitter API for Cytoscape.js Tutorial

API paths:

- POST /twitter/followers (from Postman)

```javascript
var data = "username=josephst18";
var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "http://localhost:3000/twitter/user");
xhr.setRequestHeader("cache-control", "no-cache");
xhr.setRequestHeader("postman-token", "092e4080-5e77-20c0-952d-ec0a36cef59c");
xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");

xhr.send(data);
```

- POST /twitter/followers (from Postman)

```javascript
var data = "username=josephst18";

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "http://localhost:3000/twitter/followers");
xhr.setRequestHeader("cache-control", "no-cache");
xhr.setRequestHeader("postman-token", "1e7c5a24-bbe7-d3cd-6251-16b3a8dad350");
xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");

xhr.send(data);
```