// CSS modules are compiled by scripts/build-php.mjs into class maps.
declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
