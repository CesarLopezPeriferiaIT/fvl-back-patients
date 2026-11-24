export type TNewPaciente = {
  fecha_nacimiento: string;
  edad: number;
  geolocalizacion_lat: number | null;
  geolocalizacion_lon: number | null;
  municipio_id: number | null;
  departamento_id: number | null;
  etnia: string | null;
};
