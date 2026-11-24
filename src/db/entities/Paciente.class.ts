import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('paciente')
export class PacienteEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
    paciente_id!: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
    geolocalizacion_lat!: number | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
    geolocalizacion_lon!: number | null;

  @Column({ type: 'date' })
    fecha_nacimiento!: string;

  @Column({ type: 'smallint', nullable: true })
    edad!: number | null;

  @Column({ type: 'datetime2', insert: false })
    created_at!: Date;

  @Column({ type: 'datetime2', insert: false })
    updated_at!: Date;

  @Column({ type: 'int', nullable: true })
    municipio_id!: number | null;

  @Column({ type: 'int', nullable: true })
    departamento_id!: number | null;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
    etnia!: string | null;
}
