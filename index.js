var najax   = require("najax");
var _       = require("lodash");
var http    = require("http");
var fs      = require("fs");
var cheerio = require("cheerio");
var exec    = require('child_process').exec;
var path    = require('path');

var alarmaActivada  = false;
var umbralBicicletas = 2;
var estaciones = [ 17 ];

var baseFolder = "/public";
var modulesFolder = "/node_modules";
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
            
            var estacionActual = {};
            
            if(!bicisDisponibles || !ubicacionEstacion || !nombreEstacion)
            {
            
                estacionActual = { id: estacionIdBuscada, nombre: "N/A", ubicacion: "N/A", disponibles: "N/A", data: JSON.stringify(data)  };
            }
            else
            {
                estacionActual = { id: estacionIdBuscada, nombre: nombreEstacion.valor, ubicacion: ubicacionEstacion.valor, disponibles: bicisDisponibles.valor };
            }
            
            outputEstaciones.push(estacionActual);
            
            if(parseInt(bicisDisponibles.valor) > umbralBicicletas && callbackUmbral)
            {
                callbackUmbral(estacionActual);
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

function handleSimpleFileRequest(request, response)
{
    console.log('request starting...');

    var publicFile = "." + baseFolder + (request.url.charAt(0) === "/" ? request.url : "/" + request.url);
    
    var filePath = fs.existsSync(publicFile) ? publicFile :  '.' + modulesFolder + "/" + request.url;

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname)
    {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.readFile(filePath, function(error, content)
    {
        if (error)
        {
            if(error.code == 'ENOENT')
            {
                fs.readFile("." + baseFolder + "/404.html", function(error, content)
                {
                    response.writeHead(200, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                });
            }
            else
            {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}


function handleSpecialRequest(request, response)
{
    if(_.includes(request.url, "desactivar"))
    {
        alarmaActivada = false;
        response.end("DESACTIVADA");
        return;
    }
    else if(_.includes(request.url, "activar"))
    {
        alarmaActivada = true;
        response.end("ACTIVADA");
        return;
    }

    fs.readFile("./" + baseFolder + "/index.html", function (err, html)
    {
        if (err)
        {
            throw err; 
        }    
            
        fs.readFile("./" + baseFolder + "/estacion.html", function (err, estacionHtml)
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
                    
                    $('#datosEstaciones').append(estacionHtmlModificada);
                });
                $('#estadoAlarma').text((alarmaActivada ? "ACTIVADA" : "DESACTIVADA"));
                response.write($.html());
                response.end();
            }; 
            
            traerDatosEstaciones(callback);

        });
    });       
}

var keywords = [ "index.html", "activar", "desactivar" ];    
function handleRequest(request, response)
{
    if(request.url === "/" || _.includes(keywords, request.url.split("/").slice(-1).pop()))
    {
        return handleSpecialRequest(request, response);
    }
    else
    {
        return handleSimpleFileRequest(request, response);
    }   
}    

function app()
{
    var server = http.createServer(handleRequest);
    
    server.listen(PORT, function()
    {
        console.log("Server listening on: http://localhost:%s", PORT);
    });
    
    var intervalCallback = function(estacionUmbral)
    {
        if(!alarmaActivada)
        {
            return;
        }
        exec("beep");
        console.log("HAY MAS DE %s BICICLETAS EN ESTACION %s", umbralBicicletas, estacionUmbral.nombre);
    };
    
    setInterval( function(){ traerDatosEstaciones(null, intervalCallback); }, 2000);
}

app();