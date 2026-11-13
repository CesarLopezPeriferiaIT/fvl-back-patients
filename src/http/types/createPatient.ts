export type TCreatePatientBody = {
  fecha_nacimiento: string;
  geolocalizacion_lat?: number;
  geolocalizacion_lon?: number;
  municipio_id?: number;
  departamento_id?: number;
  etnia?: string;
};
