$(document).ready(function()
{
    var options = $('body').data("options");
    
    var alarmaCheck = $('#alarmaCheck');
    alarmaCheck.prop('checked', options.estadoAlarma);
    $('#estadoAlarma').text((options.estadoAlarma ? "ACTIVADA" : "DESACTIVADA"));
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