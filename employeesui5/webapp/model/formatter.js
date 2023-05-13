sap.ui.define([], function () {
    function dateFormat(date){
        let timeDay =  24 * 60 * 60 * 1000;

        if (date) {
            let dateNow = new Date();
            let dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : 'yyyy/MM/dd'});
            let dateNowFormat = new Date(dateFormat.format(dateNow));
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            switch(true){
                case date.getTime() === dateNowFormat.getTime():
                    return oResourceBundle.getText("today");

                case date.getTime() === dateNowFormat.getTime() - timeDay:
                    return oResourceBundle.getText("yesterday");

                case date.getTime() === dateNowFormat.getTime() + timeDay:
                    return oResourceBundle.getText("tomorrow");
                
                default:
                    return "";
            }
        }
    };

    return {
        dateFormat: dateFormat
    };
});