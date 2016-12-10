var najax     = require("najax");
var _         = require("lodash");
var http      = require("http");
var fs        = require("fs");
var cheerio   = require("cheerio");
var exec      = require('child_process').exec;
var ko        = require('knockout');
var return404 = require("./404.js");

require('knockout-mapping');

var estacionesPosibles = [{ id: 17, descripcion: "Plaza almagro" },
                          { id: 70, descripcion: "Araoz"         }];

var config = {};
if(fs.existsSync('./config.js'))
{
    config  = require('./config');
}
else
{
    console.log("ARCHIVO config.js NO EXISTE");
    config.alarmaActivada   = false;
    config.UmbralAlarma     = 2;
    config.estaciones       = [ 17 ];
    config.baseFolder       = "/public";
    config.modulesFolder    = "/node_modules";
    config.PORT             =7728; 
}

var alarmaActivada   = null;
var UmbralAlarma     = null;
var estaciones       = null;
var baseFolder       = config.baseFolder;
var modulesFolder    = config.modulesFolder;
var PORT             = config.PORT;

function setConfig(conf)
{
    UmbralAlarma     = conf.UmbralAlarma;
    estaciones       = conf.estaciones;
    alarmaActivada   = conf.alarmaActivada;
}

function getConfig()
{
    var conf = {};
    
    conf.UmbralAlarma     = UmbralAlarma;
    conf.estaciones       = estaciones;
    conf.alarmaActivada   = alarmaActivada;
    
    return conf;
}

var WebServerFileHandler = require('./web-server-file-handler')(config);

setConfig(config);

/*
var estaciones = [ ];

for(var i = 1; i < 83 ; i++)
{
    estaciones.push(i);
}
*/
var urlApiCiudad = function(estacionId) { return "http://epok.buenosaires.gob.ar/getObjectContent/?id=estaciones_de_bicicletas|" + estacionId; };

var traerDatosEstaciones = function(callback, callbackUmbral)
{     
    var outputEstaciones = [];
    function receiveData(estacionIdBuscada)
    {
        var cargarInfo = function(data)
        {
            var responseJs = typeof(data) === 'object' ? data : JSON.parse(data);
            
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
            
            if(parseInt(bicisDisponibles.valor) > UmbralAlarma && callbackUmbral)
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

var commands = {
    desactivar: function(request, response)
    {
        alarmaActivada = false;
        response.end("DESACTIVADA");
    },
    activar: function(request, response)
    {
        alarmaActivada = true;
        response.end("ACTIVADA");
    },
    config: function(request, response)
    {
        var body = '';
        request.on('data', function(data)
        {
            body += data;
        });
        
        request.on('end', function(data)
        {
            setConfig(JSON.parse(body));
            response.end();
        });
    }
};

var resources = {
    estaciones: function(request, response)
    {
        response.writeHeader(200, {"Content-Type": "application/json"});  
        response.end(JSON.stringify(estacionesPosibles));
    }
};

function handleSpecialRequest(request, response, partesUrl)
{    
    var last = _.last(partesUrl);
    if(_.includes(partesUrl, "commands"))
    {
        if(_.includes(Object.keys(commands), last))
        {
            commands[last](request, response);
        }
        else
        {
            return404(fs, baseFolder, response);
        }
        return;
    }
    
    if(_.includes(partesUrl, "resources"))
    {
        if(_.includes(Object.keys(resources), last))
        {
            resources[last](request, response);
        }
        else
        {
            return404(fs, baseFolder, response);
        }
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
                
                var outputHtml = $.html();
                
                var dataOptions = { estadoAlarma: alarmaActivada, config: getConfig() };
                outputHtml = outputHtml.replace("<body>", "<body data-options='" + JSON.stringify(dataOptions) + "'>");
                
                response.write(outputHtml);
                response.end();
            }; 
            
            traerDatosEstaciones(callback);

        });
    });       
}

var keywords = [ "index.html", "commands", "resources" ];    

function handleRequest(request, response)
{
    var partesUrl = request.url.split("/");
    
    if(request.url === "/" || (partesUrl.length > 1 &&  _.includes(keywords, partesUrl[1])))
    {
        return handleSpecialRequest(request, response, partesUrl);
    }
    else
    {
        return WebServerFileHandler(request, response);
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
        console.log("HAY MAS DE %s BICICLETAS EN ESTACION %s", UmbralAlarma, estacionUmbral.nombre);
    };
    
    setInterval( function(){ traerDatosEstaciones(null, intervalCallback); }, 2000);
}

app();