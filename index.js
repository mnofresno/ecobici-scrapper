var najax   = require("najax");
var _       = require("lodash");
var http    = require("http");
var fs      = require("fs");
var cheerio = require("cheerio");
var exec = require('child_process').exec;

var estaciones = [ 17];
/*
var estaciones = [ ];

for(var i = 1; i < 83 ; i++)
{
    estaciones.push(i);
}
*/
var urlApiCiudad = function(estacionId) { return "http://epok.buenosaires.gob.ar/getObjectContent/?id=estaciones_de_bicicletas%7C" + estacionId; };

//Lets define a port we want to listen to
const PORT=7728; 


fs.readFile('./estacion.html', function (err, estacionHtml)
{
    app(estacionHtml);
});

function app(estacionHtml)
{
    fs.readFile('./index.html', function (err, html)
    {
        if (err) {
            throw err; 
        }    
            
        
        //We need a function which handles requests and send response
        function handleRequest(request, response)
        {
            var estacionesBuscadas = 0;
            
            var $ = cheerio.load(html.toString());
            
            response.writeHead(200, {'Content-Type': 'text/plain'});
            
            function receiveData(estacionIdBuscada)
            {
                var cargarInfo = function(data)
                {
                    response.writeHeader(200, {"Content-Type": "text/html"});  
                    
                    var responseJs = JSON.parse(data);
                    
                    var bicisDisponibles = _.find(responseJs.contenido, { nombreId: 'bicicletas_disponibles'});
                    var nombreEstacion = _.find(responseJs.contenido, { nombreId: 'nombre'});
                    var ubicacionEstacion = _.find(responseJs.contenido, { nombreId: 'ubicacion'});
                    
                    if(!bicisDisponibles || !ubicacionEstacion || !nombreEstacion)
                    {
                        $('body').append("<div>ESTACION NO DISPONIBLE: "+ estacionIdBuscada+"</div><span>DATA: </span>" + JSON.stringify(data));
                        estacionesBuscadas++;
                        return;
                    }
                    var estacionHtmlModificada = estacionHtml.toString();
                    estacionHtmlModificada = estacionHtmlModificada.replace("{{ bicisDisponibles }}", bicisDisponibles.valor);
                    estacionHtmlModificada = estacionHtmlModificada.replace("{{ ubicacionEstacion }}", ubicacionEstacion.valor);
                    estacionHtmlModificada = estacionHtmlModificada.replace("{{ nombreEstacion }}", nombreEstacion.valor);
                    if(parseInt(bicisDisponibles.valor)>2)
                    {
                        exec("beep", function(error, stdout, stderr) 
                        {
                            
                        });
                    }
                    
                    $('body').append(estacionHtmlModificada);
                    estacionesBuscadas++;
                    if(estacionesBuscadas === estaciones.length)
                    {
                        response.write($.html());
                        response.end();
                    }
                };
                return cargarInfo;
            }
            
            _.forEach(estaciones, function(estacionId)
            {
                najax({ url: urlApiCiudad(estacionId), success: receiveData(estacionId), contentType: "application/json" });
            });
            
        }
        
        //Create a server
        var server = http.createServer(handleRequest);
        
        //Lets start our server
        server.listen(PORT, function(){
            //Callback triggered when server is successfully listening. Hurray!
            console.log("Server listening on: http://localhost:%s", PORT);
        });
    
    
    
    });
}


