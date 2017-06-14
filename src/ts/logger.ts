const black   = 'color: black;';
const red     = 'color: red;';
const green   = 'color: green;';
const yellow  = 'color: yellow;';
const blue    = 'color: blue;';
const magenta = 'color: magenta;';
const cyan    = 'color: cyan;';
const white   = 'color: white;';
const reset   = '';

class Logger {
  public debugMode: boolean;
  public silentMode: boolean;
  public isSetup: boolean = false;

  public set(options: { debug: boolean, silent: boolean }) {
    this.debugMode = options.debug;
    this.silentMode = (options.silent == undefined)? true: options.silent;
    this.isSetup = true;
  }
  public debug(t:string) {
    if( !this.isSetup ){ this.loggerWarning(); }
    if( !this.debugMode ){ return; }
    if( this.silentMode ){ return; }
    console.log( `%c[DEBUG]%c ${t}`, cyan, reset );
  }
  public info(t:string) {
    if( !this.isSetup ){ this.loggerWarning(); }
    if( this.silentMode ){ return; }
    console.log( `%c[INFO]%c ${t}`, green, reset );
  }
  public error(t:string) {
    if( !this.isSetup ){ this.loggerWarning(); }
    console.error( `%c[ERROR]%c ${t}`, red, reset );
  }
  public warn(t:string) {
    if( !this.isSetup ){ this.loggerWarning(); }
    console.error( `%c[WARN]%c ${t}`, yellow, reset );
  }
  public obj(t:string, obj:any) {
    if( !this.isSetup ){ this.loggerWarning(); }
    if( !this.debugMode ){ return; }
    if( this.silentMode ){ return; }
    console.groupCollapsed(`%c[DEBUG]%c ${t}`, cyan, reset);
    console.log(obj);
    console.groupEnd();
  }

  private loggerWarning() {
    console.warn(`%c[WARN]%c logger has not been set up. call "set()" method`, yellow, reset);
  }
}

const logger = new Logger();
export default logger;
