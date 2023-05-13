//@ts-nocheck
sap.ui.define([
    "employeesui5/controller/Base.controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof employeesui5.controller.Base} Base
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     */
    function (Base, Filter, FilterOperator) {
        "use strict";

        function onInit () {            
            this._bus = sap.ui.getCore().getEventBus();
        };

        function onFilter () {
            let oJSONCountries = this.getView().getModel("jsonCountries").getData();
            let filter = [];

            if (oJSONCountries.EmployeeId !== "") {
                filter.push(new Filter("EmployeeID", FilterOperator.EQ, oJSONCountries.EmployeeId));
            }

            if (oJSONCountries.CountryKey !== "") {
                filter.push(new Filter("Country", FilterOperator.EQ, oJSONCountries.CountryKey));
            }

            let oList = this.getView().byId("tableEmployee");
            let oBinding = oList.getBinding("items");
            oBinding.filter(filter);
        };

        function onClearFilter () {
            let oModelCountries = this.getView().getModel("jsonCountries");
            oModelCountries.setProperty("/EmployeeId", "");
            oModelCountries.setProperty("/CountryKey", "");

            let filter = [];
            let oList = this.getView().byId("tableEmployee");
            let oBinding = oList.getBinding("items");
            oBinding.filter(filter);
        };

        function showPostalCode (oEvent) {
            let itemPressed = oEvent.getSource();
            let oContext = itemPressed.getBindingContext("odataNorthwind");
            let objectContext = oContext.getObject();

            sap.m.MessageToast.show(objectContext.PostalCode);
        };

        function onShowCity () {
            let oJSONModelConfig = this.getView().getModel("jsonConfig");
            oJSONModelConfig.setProperty("/visibleCity", true);
            oJSONModelConfig.setProperty("/visibleBtnShowCity", false);
            oJSONModelConfig.setProperty("/visibleBtnHideCity", true);
        };

        function onHideCity () {
            let oJSONModelConfig = this.getView().getModel("jsonConfig");
            oJSONModelConfig.setProperty("/visibleCity", false);
            oJSONModelConfig.setProperty("/visibleBtnShowCity", true);
            oJSONModelConfig.setProperty("/visibleBtnHideCity", false);
        };

        function onShowOrders (oEvent) {
            let iconPressed = oEvent.getSource();
            let oContext = iconPressed.getBindingContext("odataNorthwind");

            if (!this._oDialogOrders) {
                this._oDialogOrders = sap.ui.xmlfragment("employeesui5.fragment.DialogOrders", this);
                this.getView().addDependent(this._oDialogOrders);
            }
            
            this._oDialogOrders.bindElement("odataNorthwind>" + oContext.getPath());  
            this._oDialogOrders.open();
        };

        function onCloseOrders () {
            this._oDialogOrders.close();
        };

        function onShowEmployee (oEvent) {
            let path = oEvent.getSource().getBindingContext("odataNorthwind").getPath();
            this._bus.publish("flexible", "onShowEmployee", path);            
        };

        let Main = Base.extend("employeesui5.controller.MasterEmployee", {});

        Main.prototype.onInit = onInit;
        Main.prototype.onFilter = onFilter;
        Main.prototype.onClearFilter = onClearFilter;
        Main.prototype.showPostalCode = showPostalCode;
        Main.prototype.onShowCity = onShowCity;
        Main.prototype.onHideCity = onHideCity;
        Main.prototype.onShowOrders = onShowOrders;
        Main.prototype.onCloseOrders = onCloseOrders;
        Main.prototype.onShowEmployee = onShowEmployee;

        return Main; 
    });