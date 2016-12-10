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