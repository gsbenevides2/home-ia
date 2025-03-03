import { fetchFromAtlassianStatuspage } from "../../clients/AtlasianStatus.ts";
import { fetchFromIncidentIoStatus } from "../../clients/IncidentStatus.ts";
import { fetchFromInstatusStatuspage } from "../../clients/InStatusStatus.ts";
import { BinarySensor, BinarySensorDeviceClass } from "../AbstractEntities/BinarySensor.ts";

export class StatusSensors {
  private static instance: StatusSensors = new StatusSensors();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  public async sendVtexStatus() {
    const vtex = await fetchFromIncidentIoStatus("status.vtex.com");
    const sensor = new BinarySensor("status_page_vtex", "status_page_vtex", {
      friendly_name: "VTEX Status",
      device_class: BinarySensorDeviceClass.PROBLEM,
    });
    await sensor.sendState(vtex === "DOWN");
  }

  public async sendGithubStatus() {
    const github = await fetchFromAtlassianStatuspage("www.githubstatus.com");
    const sensor = new BinarySensor("status_page_github", "status_page_github", {
      friendly_name: "GitHub Status",
      device_class: BinarySensorDeviceClass.PROBLEM,
    });
    await sensor.sendState(github === "DOWN");
  }

  public async sendVercelStatus() {
    const vercel = await fetchFromAtlassianStatuspage("www.vercel-status.com");
    const sensor = new BinarySensor("status_page_vercel", "status_page_vercel", {
      friendly_name: "Vercel Status",
      device_class: BinarySensorDeviceClass.PROBLEM,
    });
    await sensor.sendState(vercel === "DOWN");
  }

  public async sendDecoStatus() {
    const deco = await fetchFromInstatusStatuspage("status.deco.cx");
    const sensor = new BinarySensor("status_page_deco", "status_page_deco", {
      friendly_name: "Deco Status",
      device_class: BinarySensorDeviceClass.PROBLEM,
    });
    await sensor.sendState(deco === "DOWN");
  }

  public async sendAllStatus() {
    await Promise.all([this.sendVtexStatus(), this.sendGithubStatus(), this.sendVercelStatus(), this.sendDecoStatus()]);
  }
}
