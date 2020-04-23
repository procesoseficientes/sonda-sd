interface Window {
    linkOsPlugin: LinkOsPlugin
}

interface LinkOsPlugin{
    initialize(
        successCallback?: (result: any) => void,
        errorCallback?: (error: string) => void
    ): any;

    getStatus(
        macAddress: string,
        bluetoothSelected: boolean,
        success?: (result: any)=> void,
        error?: (error: any)=> void
    ): any;

    connect(
        macAddress:string,
        success?:(result:any)=>void,
        error?:(error:any)=>void
        ):any;

    disconnect(
        success?:(result:any)=>void,
        error?:(error:any)=>void
        ):any;

    printCPCL(
    document:string,
    success?:(result:any)=>void,
    error?:(error:any)=>void
    ):any;

    findPrinters(
        success?: (result: any) => void,
        error?: (result: any) =>void
    ): any;

    onPrinterFound(
        discoveredPrinter:any
    ): any;
}