import { MedplumInfraConfig } from '@medplum/core';

const config: MedplumInfraConfig = {
  name: 'lotto-central-hospital-emr',
  stackName: 'LottoCentralHospitalEMR',
  accountNumber: process.env.AWS_ACCOUNT_ID ?? '',
  region: 'af-south-1',
  baseUrl: process.env.MEDPLUM_BASE_URL ?? 'http://localhost:8103/',
  apiDomainName: process.env.MEDPLUM_API_DOMAIN ?? 'api.lotto-hospital.local',
  appDomainName: process.env.MEDPLUM_APP_DOMAIN ?? 'app.lotto-hospital.local',
  storageDomainName: process.env.MEDPLUM_STORAGE_DOMAIN ?? 'storage.lotto-hospital.local',
  storageBucketName: 'lotto-hospital-medplum-storage',
  maxAzs: 2,
  rdsInstances: 1,
  desiredServerCount: 1,
  serverMemory: 2048,
  serverCpu: 1024,
  serverImage: 'medplum/medplum-server:3.2.0',
};

export default config;
