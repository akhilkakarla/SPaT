fetch('http://129.114.36.77:8080/spat_decoded')
.then(response => response.json())
.then(json => console.log(json))

