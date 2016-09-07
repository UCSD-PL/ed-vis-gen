
// utility functions for sending GETs + POSTs to a url, specialized to our webserver
// pulled from http://stackoverflow.com/questions/247483/http-get-request-in-javascript

export function sendGet(urlTail: string, callback: (s: string) => any) {
  const url = "http://goto.ucsd.edu:8081/" + urlTail
  const req = new XMLHttpRequest()
  req.onreadystatechange = ()  => {
    if (req.readyState == 4 && req.status == 200) {
      callback(req.responseText)
    }
  }
  req.open("GET", url, true) // true for asynchronous
  req.send(null)
}
