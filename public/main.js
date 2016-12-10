$(document).ready(function()
{
    var options = $('body').data("options");
    
    var alarmaCheck = $('#alarmaCheck');
    alarmaCheck.prop('checked', options.estadoAlarma);
    setEstadoAlarma((options.estadoAlarma ? "ACTIVADA" : "DESACTIVADA"));
    alarmaCheck.on('change', function()
    {
        if(alarmaCheck.prop('checked'))
        {
            activarAlarma();
        }
        else
        {
            desactivarAlarma();
        }
    });
});

var activarAlarma = function()
{
    $.ajax({ url: "/activar", success: setEstadoAlarma });
};

var desactivarAlarma = function()
{
    $.ajax({ url: "/desactivar", success: setEstadoAlarma });
};

var setEstadoAlarma = function(response)
{
    $('#estadoAlarma').text(response);
};

var setConfig = function(config)
{
    $.ajax({ url: "/config", data: "config", method: "POST", contentType: "application/json" });
};