import { onRequestOptions as __api_appointment_request_js_onRequestOptions } from "C:\\Users\\prest\\Shoebox Stories Website\\functions\\api\\appointment-request.js"
import { onRequestPost as __api_appointment_request_js_onRequestPost } from "C:\\Users\\prest\\Shoebox Stories Website\\functions\\api\\appointment-request.js"

export const routes = [
    {
      routePath: "/api/appointment-request",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_appointment_request_js_onRequestOptions],
    },
  {
      routePath: "/api/appointment-request",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_appointment_request_js_onRequestPost],
    },
  ]