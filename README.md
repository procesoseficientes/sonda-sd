# SondaPreSales
Sonda Mobile para Pre-ventas y distribución de rutas

## Dependencias
- Cordova 7.0.0
- Node 9.5.0

## Uso
1. Instalar Cordova, versión 7.0.0
```bash
npm install -g cordova@7.0.0
```
2. Agregar e iniciar el proyecto de cordova
```bash
cordova platform add android@6.2.3
```
A veces es necesario correr esto dos veces, puede tomar unos cuantos minutos.

3. Compilar el código Typescript
```bash
tsc
```
4. Construir aplicación Android
```bash
cordova build android
```


## Config
El archivo `conf.json` va aquí:
```Memoria interna\Android\data\mobility.sonda.sd\files```

El formato es:
```json
{"url":"<URL DEL CLIENTE>"}
```