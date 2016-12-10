$(document).ready(function()
{
    var options = $('body').data("options");
    
    var alarmaCheck = $('#alarmaCheck');
    
    setEstadoAlarma((options.estadoAlarma ? "ACTIVADA" : "DESACTIVADA"));
    
    alarmaCheck.bootstrapToggle(( options.config.alarmaActivada ? "on" : "off"));
    
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
    
    var element = $('#main');
    var viewModel = new ViewModel();
    viewModel.LeerConfig(options.config);
    ko.applyBindings(viewModel, element[0]);
});

function ViewModel()
{
    var self = this;
   
    self.Config = new ConfigViewModel();
    
    self.GuardarConfig = function()
    {
        var datos = ko.mapping.toJS(self.Config);
        setConfig(datos);
    };
    
    self.LeerConfig = function(data)
    {
        ko.mapping.fromJS(data, self.Config);
        self.Config.alarmaActivada(data.alarmaActivada);
        self.Config.UmbralAlarma(data.UmbralAlarma);
        self.Config.estaciones(data.estaciones);
        
    };
    
    return self;
}

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
    $.ajax({ url: "/config", data: ko.toJSON(config), method: "POST", contentType: "application/json" });
};