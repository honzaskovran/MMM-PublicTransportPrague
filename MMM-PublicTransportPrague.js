/* global Module */

/* Magic Mirror
 * Module: MMM-PublicTransportPrague
 *
 * By Honza Škovran
 * MIT Licensed.
 */

Module.register("MMM-PublicTransportPrague", {
  defaults: {
    updateInterval: 60000,
    retryDelay: 5000,
    from: 'Chodov',
    to: 'Palmovka'
  },

  requiresVersion: "2.1.0", // Required version of MagicMirror

  start: function () {
    const self = this;
    let dataRequest = null;
    let dataNotification = null;

    //Flag for check if module is loaded
    this.loaded = false;

    // Schedule update timer.
    this.getData();
    setInterval(function () {
      self.updateDom();
    }, this.config.updateInterval);
  },

  /*
   * getData
   * function example return data and show it in the module wrapper
   * get a URL request
   *
   */
  getData: function () {
    const self = this;

    const baseUrl = 'http://obiwan.cloud:3001/find-connection?';
    const urlApi = `${baseUrl}from=${this.config.from}&to=${this.config.to}`;
    let retry = true;

    const dataRequest = new XMLHttpRequest();
    dataRequest.open("GET", urlApi, true);
    dataRequest.onreadystatechange = function () {
      console.log(this.readyState);
      if (this.readyState === 4) {
        console.log(this.status);
        if (this.status === 200) {
          self.processData(JSON.parse(this.response));
        } else if (this.status === 401) {
          self.updateDom(self.config.animationSpeed);
          Log.error(self.name, this.status);
          retry = false;
        } else {
          Log.error(self.name, "Could not load data.");
        }
        if (retry) {
          self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
        }
      }
    };
    dataRequest.send();
  },


  /* scheduleUpdate()
   * Schedule next update.
   *
   * argument delay number - Milliseconds before next update.
   *  If empty, this.config.updateInterval is used.
   */
  scheduleUpdate: function (delay) {
    let nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }
    nextLoad = nextLoad;
    const self = this;
    setTimeout(function () {
      self.getData();
    }, nextLoad);
  },

  getDom: function () {
    const self = this;

    // create element wrapper for show into the module
    const wrapper = document.createElement("div");
    // If this.dataRequest is not empty
    if (this.dataRequest) {
      for(let i = 0; i < this.dataRequest.length; i++) {
        wrapper.appendChild(self.formatConnection(this.dataRequest[i]));
      }
    }

    // Data from helper
    if (this.dataNotification) {
      const wrapperDataNotification = document.createElement("div");
      // translations  + datanotification
      wrapperDataNotification.innerHTML = this.translate("UPDATE") + ": " + this.dataNotification.date;

      wrapper.appendChild(wrapperDataNotification);
    }
    return wrapper;
  },

  formatConnection: function (connection) {
    const connectionWrapper = document.createElement("div");
    const connectionTime = document.createElement("h2");
    connectionTime.innerHTML = `${connection.start} - ${connection.end}`;

    connectionWrapper.appendChild(connectionTime);

    for(let i = 0; i < connection.routes.length; i++) {
      const route = connection.routes[i];
      const routeWrapper = document.createElement('div');

      routeWrapper.innerHTML = `<h3>${route.type} ${route.line}</h3><div class="route"><div class="start"><span class="time">${route.start.time}</span> <span class="station">${route.start.station}</span></div><div class="end"><span class="time">${route.end.time}</span> <span class="station">${route.end.station}</span></div></div>`;

      connectionWrapper.appendChild(routeWrapper);
    }

    return connectionWrapper;
  },

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return [
      "MMM-PublicTransportPrague.css",
    ];
  },

  // Load translations files
  getTranslations: function () {
    //FIXME: This can be load a one file javascript definition
    return {
      en: "translations/en.json",
      es: "translations/es.json"
    };
  },

  processData: function (data) {
    const self = this;
    this.dataRequest = data;
    if (this.loaded === false) {
      self.updateDom(self.config.animationSpeed);
    }
    this.loaded = true;

    // the data if load
    // send notification to helper
    this.sendSocketNotification("MMM-PublicTransportPrague-NOTIFICATION_TEST", data);
  },

  // socketNotificationReceived from helper
  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM-PublicTransportPrague-NOTIFICATION_TEST") {
      // set dataNotification
      this.dataNotification = payload;
      this.updateDom();
    }
  },
});
