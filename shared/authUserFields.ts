export const authUserFields = {
  phoneBn: { type: 'string', required: false, input: true },
  userRoleBn: { type: 'string', required: false, defaultValue: 'কৃষক', input: true },
  positionTitleBn: { type: 'string', required: false, input: true },
  divisionId: { type: 'string', required: false, input: true },
  districtId: { type: 'string', required: false, input: true },
  upazilaId: { type: 'string', required: false, input: true },
  adminRole: { type: 'string', required: false, input: false },
} as const;
