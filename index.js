var najax   = require("najax");
var _       = require("lodash");
var http    = require("http");
var fs      = require("fs");
var cheerio = require("cheerio");
var exec = require('child_process').exec;

var umbralBicicletas = 2;
var estaciones = [ 17];
/*
var estaciones = [ ];

for(var i = 1; i < 83 ; i++)
{
    estaciones.push(i);
}
*/
var urlApiCiudad = function(estacionId) { return "http://epok.buenosaires.gob.ar/getObjectContent/?id=estaciones_de_bicicletas|" + estacionId; };

//Lets define a port we want to listen to
const PORT=7728; 

var traerDatosEstaciones = function(callback, callbackUmbral)
{     
    var outputEstaciones = [];
    function receiveData(estacionIdBuscada)
    {
        var cargarInfo = function(data)
        {
            
            var responseJs = JSON.parse(data);
            
            var bicisDisponibles  = _.find(responseJs.contenido, { nombreId: 'bicicletas_disponibles'});
            var nombreEstacion    = _.find(responseJs.contenido, { nombreId: 'nombre'});
            var ubicacionEstacion = _.find(responseJs.contenido, { nombreId: 'ubicacion'});
            outputEstaciones.push({ id: estacionIdBuscada, nombre: nombreEstacion.valor, ubicacion: ubicacionEstacion.valor, disponibles: bicisDisponibles.valor });
            
            if(!bicisDisponibles || !ubicacionEstacion || !nombreEstacion)
            {
                outputEstaciones.push({ id: estacionIdBuscada, nombre: "N/A", ubicacion: "N/A", disponibles: "N/A", data: JSON.stringify(data)  });
            }
            
            if(parseInt(bicisDisponibles.valor) > umbralBicicletas && callbackUmbral)
            {
                callbackUmbral();
            }
            
            if(outputEstaciones.length === estaciones.length && callback)
            {
                callback(outputEstaciones);
            }
        };
        return cargarInfo;
    }
       
    _.forEach(estaciones, function(estacionId)
    {
        najax({ url: urlApiCiudad(estacionId), success: receiveData(estacionId), error: receiveData(estacionId), contentType: "application/json" });
    });
};

function app()
{
    function handleRequest(request, response)
    {
        fs.readFile('./index.html', function (err, html)
        {
            if (err)
            {
                throw err; 
            }    
                
            fs.readFile('./estacion.html', function (err, estacionHtml)
            {
                if (err)
                {
                    throw err; 
                }    
            
                var $ = cheerio.load(html.toString());
                
                response.writeHeader(200, {"Content-Type": "text/html"});  
                
                var callback = function(outputEstaciones)
                {
                    _.forEach(outputEstaciones, function(estacion)
                    {
                        var estacionHtmlModificada = estacionHtml.toString();
                        estacionHtmlModificada = estacionHtmlModificada.replace("{{ bicisDisponibles }}" , estacion.disponibles);
                        estacionHtmlModificada = estacionHtmlModificada.replace("{{ ubicacionEstacion }}", estacion.ubicacion  );
                        estacionHtmlModificada = estacionHtmlModificada.replace("{{ nombreEstacion }}"   , estacion.nombre     );
                        
                        $('body').append(estacionHtmlModificada);
                    });
                
                    response.write($.html());
                    response.end();
                }; 
                
                traerDatosEstaciones(callback);

            });
        });       
    }

        
    var server = http.createServer(handleRequest);
    
    server.listen(PORT, function()
    {
        console.log("Server listening on: http://localhost:%s", PORT);
    });
    
    var intervalCallback = function(data)
    {
        exec("beep");
    };
    
    setInterval( function(){ traerDatosEstaciones(null, intervalCallback); }, 1000);
}

app();