export type ApiValidationInterface =
    | {
          valid: true;
          exchangeUserAccountId: string;
      }
    | {
          valid: false;
          exchangeUserAccountId: null;
      };
