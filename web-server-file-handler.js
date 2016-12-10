var path    = require('path');
var fs      = require("fs");

function handleSimpleFileRequest(config)
{
    return function(request, response)
    {
        var modulesFolder = config.modulesFolder;
        var baseFolder = config.baseFolder;
        
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
                        response.writeHead(404, { 'Content-Type': 'text/html' });
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
}

module.exports = handleSimpleFileRequest;