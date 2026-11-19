import "server-only";
import careers from "../data/careers.json";
import resources from "../data/resources.json";
import { loadCatalog } from "./catalogLoader";

export { loadCatalog };
export const { getCareer, getResource, listCareers, careerIds } = loadCatalog(careers, resources);
