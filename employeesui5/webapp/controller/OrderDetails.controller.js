//@ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], 
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.m.core.routing.History} History
     * @param {typeof sap.m.MessageBox} MessageBox
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     */
    function(Controller, History, MessageBox, Filter, FilterOperator){
    
        function _onObjectMatched (oEvent){
            this.onClearSignature();

            this.getView().bindElement({
                path: "/Orders(" + oEvent.getParameter("arguments").OrderId + ")",
                model: "odataNorthwind",
                events: {
                    dataReceived: function (oData) {
                        _readSignature.bind(this)(oData.getParameter("data").OrderID, oData.getParameter("data").EmployeeID);
                    }.bind(this)
                }
            });

            const objContext = this.getView().getModel("odataNorthwind").getContext("/Orders(" + oEvent.getParameter("arguments").OrderId + ")").getObject();

            if (objContext) {
                _readSignature.bind(this)(objContext.OrderID, objContext.EmployeeID);
            }
        };

        function _readSignature (orderId, employeeId){
            //Read signature
            this.getView().getModel("incidenceModel").read("/SignatureSet(OrderId='" + orderId + 
                                                        "',SapId='" + this.getOwnerComponent().SapId + 
                                                        "',EmployeeId='" + employeeId + "')", {
                success: function (data) {
                    const signature = this.getView().byId("signature");

                    if (data.MediaContent !== "") {
                        signature.setSignature("data:image/png;base64," + data.MediaContent);
                    }   
                }.bind(this),

                error: function (data){

                }
            });

            //Read files uploaded
            this.byId("uploadSet").bindAggregation("items", {
                path: "incidenceModel>/FilesSet",
                filters: [
                    new Filter("OrderId", FilterOperator.EQ, orderId) ,
                    new Filter("SapId", FilterOperator.EQ, this.getOwnerComponent().SapId),
                    new Filter("EmployeeId", FilterOperator.EQ, employeeId)
                ],
                template: new sap.m.upload.UploadSetItem({
                    fileName: "{incidenceModel>FileName}",
                    mediaType: "{incidenceModel>MimeType}",
                    visibleEdit: false
                })
            });
        };
    
        return Controller.extend("employeesui5.controller.OrderDetails", {
        
            onInit: function () {  
                let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteOrderDetails").attachPatternMatched(_onObjectMatched, this);
            },

            onBack: function (oEvent) {
                let oHistory = History.getInstance();
                let sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("RouteApp", true);
                }
            },

            onClearSignature: function (oEvent) {
                let signature = this.byId("signature");
                signature.clear();
            },

            factoryOrderDetails: function (listId, oContext) {
                let objectContext = oContext.getObject();
                objectContext.Currency = "EUR";
                let unitsInStock = oContext.getModel().getProperty("/Products(" + objectContext.ProductID + ")/UnitsInStock");

                if (objectContext.Quantity <= unitsInStock) {
                    let objectListItem = new sap.m.ObjectListItem({
                        title: "{odataNorthwind>/Products(" + objectContext.ProductID + ")/ProductName} ({odataNorthwind>Quantity})",
                        number: "{parts: [{path: 'odataNorthwind>UnitPrice'}, {path: 'odataNorthwind>Currency'}], type: 'sap.ui.model.type.Currency', formatOptions: {showMeasure: false}}",
                        numberUnit: "{odataNorthwind>Currency}"
                    });

                    return objectListItem;

                } else {
                    let customListItem = new sap.m.CustomListItem({
                        content: [
                            new sap.m.Bar({
                                contentLeft: new sap.m.Label({
                                    text: "{odataNorthwind>/Products(" + objectContext.ProductID + ")/ProductName} ({odataNorthwind>Quantity})",
                                }),
                                contentMiddle: new sap.m.ObjectStatus({
                                    text: "{i18n>availableStock} {odataNorthwind>/Products("+ objectContext.ProductID + ")/UnitsInStock}",
                                    state: "Error"
                                }),
                                contentRight: new sap.m.Label({
                                    text: "{parts: [{path: 'odataNorthwind>UnitPrice'}, {path: 'odataNorthwind>Currency'}], type: 'sap.ui.model.type.Currency'}"
                                })
                            })
                        ]
                    });

                    return customListItem;
                };
            },

            onSaveSignature: function (oEvent) {
                const signature = this.byId("signature");
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                let signaturePng;

                if (signature.isFill()) {
                    signaturePng = signature.getSignature().replace("data:image/png;base64,", "");

                    let objectOrder = oEvent.getSource().getBindingContext("odataNorthwind").getObject();
                    let body = {
                        OrderId: objectOrder.OrderID.toString(), 
                        SapId: this.getOwnerComponent().SapId,
                        EmployeeId: objectOrder.EmployeeID.toString(),
                        MimeType: "image/png",
                        MediaContent: signaturePng
                    };

                    this.getView().getModel("incidenceModel").create("/SignatureSet", body, {
                        success: function () {
                            MessageBox.information(oResourceBundle.getText("signatureSaved"));
                        },

                        error: function () {
                            MessageBox.error(oResourceBundle.getText("signatureNotSaved"));
                        }
                    });
                    
                } else {
                    MessageBox.error(oResourceBundle.getText("fillSignature"));
                }
            },

            onFileBeforeUpload: function (oEvent) {
                let oUploadSet = oEvent.getSource();
                let fileName = oEvent.getParameter("item").getFileName();
                let objContext = oEvent.getSource().getBindingContext("odataNorthwind").getObject();

                //SLUG
                let oCustomerHeaderSlug = new sap.ui.core.Item({
                    key: "Slug",
                    text: objContext.OrderID + ";" + this.getOwnerComponent().SapId + ";" + objContext.EmployeeID + ";" + fileName
                });

                //CSRF token
                let oCustomerHeaderToken = new sap.ui.core.Item({
                    key: "X-CSRF-Token",
                    text: this.getView().getModel("incidenceModel").getSecurityToken()
                });

                oUploadSet.addHeaderField(oCustomerHeaderToken); 
                oUploadSet.addHeaderField(oCustomerHeaderSlug);           
            },

            onFileUploadComplete: function (oEvent) {
                let oUploadSet = oEvent.getSource();
                oUploadSet.getBinding("items").refresh();
            },

            onFileDeleted: function (oEvent) {
                let oUploadSet = oEvent.getSource();
                let sPath = oEvent.getParameter("item").getBindingContext("incidenceModel").getPath();

                this.getView().getModel("incidenceModel").remove(sPath, {
                    success: function () {
                        oUploadSet.getBinding("items").refresh();
                    },

                    error: function () {
                    }
                });
            },

            onDownloadFile: function () {
                let oUploadSet = this.byId("uploadSet");
                let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                let aItems = oUploadSet.getSelectedItems();

                if (aItems.length === 0) {
                    MessageBox.error(oResourceBundle.getText("selectFile"));
                } else {
                    aItems.forEach((oItem)=>{
                        let sPath = oItem.getBindingContext("incidenceModel").getPath();
                        window.open("/employeesui5/sap/opu/odata/sap/YSAPUI5_SRV_01" + sPath + "/$value");
                    });
                }
            }
        });
    });