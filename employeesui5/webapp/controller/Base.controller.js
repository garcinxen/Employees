//@ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        function onInit () {            
           
        };

        function toOrderDetails (oEvent) {
            let orderId = oEvent.getSource().getBindingContext("odataNorthwind").getObject().OrderID;
            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);

            oRouter.navTo("RouteOrderDetails", {
                OrderId: orderId
            });
        };

        let Main = Controller.extend("employeesui5.controller.Base", {});

        Main.prototype.onInit = onInit;
        Main.prototype.toOrderDetails = toOrderDetails;

        return Main; 
    });