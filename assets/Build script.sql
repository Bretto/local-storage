
# --- !Ups

create table T_DEPARTEMENT (
  id                        bigint not null,
  NAME                      varchar2(50) not null,
  constraint uq_T_DEPARTEMENT_NAME unique (NAME),
  constraint pk_T_DEPARTEMENT primary key (id))
;

create table T_EMPLOYEE (
  id                        bigint not null,
  NOM                       varchar2(50) not null,
  PRENOM                    varchar2(50) not null,
  EMAIL                     varchar2(150) not null,
  ADRESSE                   varchar2(300),
  fonction_id               bigint,
  departement_id            bigint,
  constraint pk_T_EMPLOYEE primary key (id))
;

create table T_FONCTION (
  id                        bigint not null,
  NAME                      varchar2(50) not null,
  constraint uq_T_FONCTION_NAME unique (NAME),
  constraint pk_T_FONCTION primary key (id))
;

create sequence T_DEPARTEMENT_seq;

create sequence T_EMPLOYEE_seq;

create sequence T_FONCTION_seq;

alter table T_EMPLOYEE add constraint fk_T_EMPLOYEE_fonction_1 foreign key (fonction_id) references T_FONCTION (id) on delete restrict on update restrict;
create index ix_T_EMPLOYEE_fonction_1 on T_EMPLOYEE (fonction_id);
alter table T_EMPLOYEE add constraint fk_T_EMPLOYEE_departement_2 foreign key (departement_id) references T_DEPARTEMENT (id) on delete restrict on update restrict;
create index ix_T_EMPLOYEE_departement_2 on T_EMPLOYEE (departement_id);



# --- !Downs

SET REFERENTIAL_INTEGRITY FALSE;

drop table if exists T_DEPARTEMENT;

drop table if exists T_EMPLOYEE;

drop table if exists T_FONCTION;

SET REFERENTIAL_INTEGRITY TRUE;

drop sequence if exists T_DEPARTEMENT_seq;

drop sequence if exists T_EMPLOYEE_seq;

drop sequence if exists T_FONCTION_seq;

