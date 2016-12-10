if(!ko)
{
    var ko      = require('knockout');    
}


function ConfigViewModel()
{
    var self = this;
    
    self.UmbralAlarma   = ko.observable(2);
    self.estaciones     = ko.observableArray([16]);
    self.alarmaActivada = ko.observable(false);
    
    self.estacion = ko.observable();
    
    return self;
}

if( typeof module !== 'undefined')
{
    module.exports = ConfigViewModel;
}