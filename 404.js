function return404(fs, baseFolder, response)
{
    fs.readFile("." + baseFolder + "/404.html", function(error, content)
    {
        response.writeHead(404, { 'Content-Type': 'text/html' });
        response.end(content, 'utf-8');
    });
}

module.exports = return404;