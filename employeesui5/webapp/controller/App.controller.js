//@ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], 
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.m.MessageBox} MessageBox
     */
    function(Controller, MessageBox){
        "use strict";

        return Controller.extend("employeesui5.controller.App", {
            onBeforeRendering: function () {
                this._detailEmployeeView = this.getView().byId("employeeDetailsView");
            },

            onInit: function () {
                let oView = this.getView();
                
                let oJSONModelEmpl = new sap.ui.model.json.JSONModel();
                oJSONModelEmpl.loadData("./model/json/Employees.json");
                oView.setModel(oJSONModelEmpl, "jsonEmployees");

                let oJSONModelCoun = new sap.ui.model.json.JSONModel();
                oJSONModelCoun.loadData("./model/json/Countries.json");
                oView.setModel(oJSONModelCoun, "jsonCountries");

                let oJSONModelLayout = new sap.ui.model.json.JSONModel();
                oJSONModelLayout.loadData("./model.json/Layout.json");
                oView.setModel(oJSONModelLayout, "jsonLayout");

                let oJSONModelConfig = new sap.ui.model.json.JSONModel({
                    visibleID: true,
                    visibleName: true,
                    visibleCountry: true,
                    visibleCity: false,
                    visibleBtnShowCity: true,
                    visibleBtnHideCity: false
                });
                oView.setModel(oJSONModelConfig, "jsonConfig");

                this._bus = sap.ui.getCore().getEventBus();
                this._bus.subscribe("flexible", "onShowEmployee", this.showEmployeeDetails, this);
                this._bus.subscribe("incidence", "onSaveIncidence", this.onSaveODataIncidence, this);
                this._bus.subscribe("incidence", "onDeleteIncidence", function (channelId, eventId, data) {
                    
                    let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                    
                    this.getView().getModel("incidenceModel").remove(
                    "/IncidentsSet(IncidenceId='" + data.IncidenceId + 
                    "',SapId='" + data.SapId +
                    "',EmployeeId='" + data.EmployeeId + "')", {
                        success: function () {
                            this.onReadODataIncidence.bind(this)(data.EmployeeId);
                            sap.m.MessageToast.show(oResourceBundle.getText("odataDeleteOK"));
                        }.bind(this),
                        error: function (e) {
                            sap.m.MessageToast.show(oResourceBundle.getText("odataDeleteKO"));
                        }.bind(this)
                    });

                }, this);
            },

            showEmployeeDetails: function (category, nameEvent, path) {
                let detailView = this.getView().byId("employeeDetailsView");
                detailView.bindElement("odataNorthwind>" + path);
                this.getView().getModel("jsonLayout").setProperty("/ActiveKey", "TwoColumnsMidExpanded");

                let incidenceModel = new sap.ui.model.json.JSONModel([]);
                detailView.setModel(incidenceModel, "incidenceModel");
                detailView.byId("tableIncidence").removeAllContent();

                this.onReadODataIncidence(this._detailEmployeeView.getBindingContext("odataNorthwind").getObject().EmployeeID);
            },

            onSaveODataIncidence: function (channelId, eventId, data) {
                let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                let employeeId = this._detailEmployeeView.getBindingContext("odataNorthwind").getObject().EmployeeID;
                let incidenceModel = this._detailEmployeeView.getModel("incidenceModel").getData();

                if (typeof incidenceModel[data.incidenceRow].IncidenceId == 'undefined') {
                    let body = {
                        SapId: this.getOwnerComponent().SapId,
                        EmployeeId: employeeId.toString(),
                        CreationDate: incidenceModel[data.incidenceRow].CreationDate,
                        Type: incidenceModel[data.incidenceRow].Type,
                        Reason: incidenceModel[data.incidenceRow].Reason
                    };
                    
                    this.getView().getModel("incidenceModel").create("/IncidentsSet", body, {
                        success: function () {
                            this.onReadODataIncidence.bind(this)(employeeId);
                            MessageBox.success(oResourceBundle.getText("odataSaveOK"));
                        }.bind(this),

                        error: function (e) {
                            sap.m.MessageToast.show(oResourceBundle.getText("odataSaveKO"));
                        }.bind(this)
                    });
                } else if (incidenceModel[data.incidenceRow].CreationDateX || 
                        incidenceModel[data.incidenceRow].ReasonX || 
                        incidenceModel[data.incidenceRow].TypeX) {
                    let body = {
                        CreationDate: incidenceModel[data.incidenceRow].CreationDate,
                        CreationDateX: incidenceModel[data.incidenceRow].CreationDateX,
                        Reason: incidenceModel[data.incidenceRow].Reason,
                        ReasonX: incidenceModel[data.incidenceRow].ReasonX,
                        Type: incidenceModel[data.incidenceRow].Type,
                        TypeX: incidenceModel[data.incidenceRow].TypeX
                    };

                    this.getView().getModel("incidenceModel").update(
                    "/IncidentsSet(IncidenceId='" + incidenceModel[data.incidenceRow].IncidenceId + 
                    "',SapId='" + incidenceModel[data.incidenceRow].SapId +
                    "',EmployeeId='" + incidenceModel[data.incidenceRow].EmployeeId + "')", body, {
                        success: function () {
                            this.onReadODataIncidence.bind(this)(employeeId);
                            sap.m.MessageToast.show(oResourceBundle.getText("odataUpdateOK"));
                        }.bind(this),
                        error: function (e) {
                            sap.m.MessageToast.show(oResourceBundle.getText("odataUpdateKO"));
                        }.bind(this)
                    });

                } else {
                    sap.m.MessageToast.show(oResourceBundle.getText("odataNoChanges"));
                }
            },

            onReadODataIncidence: function (employeeId) {
                this.getView().getModel("incidenceModel").read("/IncidentsSet", {
                    filters: [
                        new sap.ui.model.Filter("SapId", "EQ", this.getOwnerComponent().SapId),
                        new sap.ui.model.Filter("EmployeeId", "EQ", employeeId.toString())
                    ],
                    success: function (data) {
                        let incidenceModel = this._detailEmployeeView.getModel("incidenceModel");
                        incidenceModel.setData(data.results);

                        let tableIncidence =  this._detailEmployeeView.byId("tableIncidence");
                        tableIncidence.removeAllContent();

                        for (let incidence in data.results) {
                            data.results[incidence]._validateDate = true;
                            data.results[incidence].enabledSave = false;

                            let newIncidence = sap.ui.xmlfragment("employeesv2.fragment.NewIncidence", this._detailEmployeeView.getController());
                            this._detailEmployeeView.addDependent(newIncidence);
                            newIncidence.bindElement("incidenceModel>/" + incidence);
                            tableIncidence.addContent(newIncidence);
                        };
                    }.bind(this),
                    error: function (e) {

                    }.bind(this)
                });
            }
        });
    });