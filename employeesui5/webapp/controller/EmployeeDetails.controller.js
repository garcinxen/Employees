//@ts-nocheck
sap.ui.define([
    "employeesui5/controller/Base.controller",
    "employeesui5/model/formatter",
    "sap/m/MessageBox"
], 
    /**
     * @param {typeof employeesui5.controller.Base} Base
     * @param {typeof employeesui5.model.formatter} formatter
     * @param {typeof sap.m.MessageBox} MessageBox
     */
    function(Base, formatter, MessageBox){
        "use strict";

        function onInit () {
            this._bus = sap.ui.getCore().getEventBus();
        };

        function onCreateIncidence () {
            let tableIncidence = this.getView().byId("tableIncidence");
            let newIncidence = sap.ui.xmlfragment("employeesui5.fragment.NewIncidence", this);
            let incidenceModel = this.getView().getModel("incidenceModel");
            let odata = incidenceModel.getData();
            let index = odata.length;
            odata.push({index : index + 1, _validateDate: false, enabledSave: false});
            incidenceModel.refresh();
            newIncidence.bindElement("incidenceModel>/" + index);
            tableIncidence.addContent(newIncidence);
        };

        function onDeleteIncidence (oEvent) {            
            let oContext = oEvent.getSource().getBindingContext("incidenceModel").getObject();
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            MessageBox.confirm(oResourceBundle.getText("confirmDelete"), {
                onClose: function (oAction) {
                    if (oAction === "OK") {
                        this._bus.publish("incidence", "onDeleteIncidence", {
                            IncidenceId: oContext.IncidenceId,
                            SapId: oContext.SapId,
                            EmployeeId: oContext.EmployeeId
                        });
                    }
                }.bind(this)
            });
        };

        function onSaveIncidence (oEvent) {
            let incidence = oEvent.getSource().getParent().getParent();
            let rowIncidence = incidence.getBindingContext("incidenceModel");         
            this._bus.publish("incidence", "onSaveIncidence", {incidenceRow : rowIncidence.sPath.replace('/','')});
        };

        function updateIncidenceCreationDate (oEvent) {
            let context = oEvent.getSource().getBindingContext("incidenceModel");
            let oContext = context.getObject();
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            if (!oEvent.getSource().isValidValue()) {
                oContext._validateDate = false;
                oContext.CreationDateState = "Error";
                MessageBox.error(oResourceBundle.getText("invalidDate"), {
                    title: "Error",
                    onClose: null,
                    styleClass: "",
                    actions: MessageBox.Action.Close,
                    emphasizedAction: null,
                    initialFocus: null,
                    textDirection: sap.ui.core.TextDirection.Inherit
                });
            } else {
                oContext._validateDate = true;
                oContext.CreationDateState = "None";
                oContext.CreationDateX = true;
            };

            if (oEvent.getSource().isValidValue() && oContext.Reason) {
                oContext.enabledSave = true;
            } else {
                oContext.enabledSave = false;
            };
            
            context.getModel().refresh();
        };

        function updateIncidenceReason (oEvent) {
            let context = oEvent.getSource().getBindingContext("incidenceModel");
            let oContext = context.getObject();
            
            if (oEvent.getSource().getValue()) {            
                oContext.ReasonState = "None";
                oContext.ReasonX = true;
            } else {
                oContext.ReasonState = "Error";
            };

            if (oContext._validateDate && oEvent.getSource().getValue()) {
                oContext.enabledSave = true;
            } else {
                oContext.enabledSave = false;
            };
            
            context.getModel().refresh();
        };

        function updateIncidenceType (oEvent) {
            let context = oEvent.getSource().getBindingContext("incidenceModel");
            let oContext = context.getObject();
            oContext.TypeX = true;

            if (oContext._validateDate && oContext.Reason) {
                oContext.enabledSave = true;
            } else {
                oContext.enabledSave = false;
            };

            context.getModel().refresh();
        };

        let EmployeeDetails = Base.extend("employeesui5.controller.EmployeeDetails", {});

        EmployeeDetails.prototype.onInit = onInit;
        EmployeeDetails.prototype.onCreateIncidence = onCreateIncidence;
        EmployeeDetails.prototype.Formatter = formatter;
        EmployeeDetails.prototype.onDeleteIncidence = onDeleteIncidence;
        EmployeeDetails.prototype.onSaveIncidence = onSaveIncidence;
        EmployeeDetails.prototype.updateIncidenceCreationDate = updateIncidenceCreationDate;
        EmployeeDetails.prototype.updateIncidenceReason = updateIncidenceReason;
        EmployeeDetails.prototype.updateIncidenceType = updateIncidenceType;

        return EmployeeDetails;
    });