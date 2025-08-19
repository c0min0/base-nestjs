# NestJS Base
[Inglés](../README.md)
| [Catalán](./README.ca.md)

Este proyecto es una base que sirve como implementación de todo aquello común a distintos proyectos de NestJS.

El proyecto se divide en dos apartados:
- `src/common`: Donde se encuentran las constantes y utilidades transversales a la aplicación.
- `src/modules`: Donde llacen los distintos módulos de funcionalidad de la aplicación.

## Modules

### ConfigModule
Módulo encargado de importar las **varibles de entorno**.

Dentro de `src/common/constants` se encuentran las constantes necesarias para tipar la configuración del módulo.

En `.env.sample` se encuentra un ejemplo de fichero de variables de entorno.

Las variables de entorno deben ir en la raiz del proyecto bajo el nombre de `.env`.

Hay variables que pueden ser omitidas según el entorno de despliegue y que toman valores por defecto en caso de omitirse. Consultar la implementación del módulo para más información.

### DatabaseModule
Módulo encargado de la **configuración** y **conexión** con la **base de datos**.

Este módulo dispones de un `TransactionInterceptor` que se puede usar a nivel de clase o handler para gestionar toda la request bajo la misma transacción. Junto con él, gracias al decorador `@InjectTransactionalRepository(Entity)` se puede obtener un repositorio de la entidad definida en los parámetros del decorador, que realice las acciones dentro de la transacción establecida por el interceptor. Este decorador está pensado para usarse en la inyección de dependencias de los servicios.

### GlobalInterceptorsModule
Módulo encargado de **registrar interceptores globales** que se ejecutan en todas las requests de la aplicación.

Gracias a este módulo, la aplicación dispone de un único punto de instanciación global para los interceptores, siendo así claro y sencillo el **orden de ejecución** de estos.

### RequestContextModule
Módulo encargado de gestionar el **contexto de la request**.

Contiene un **interceptor global** que setea el contexto de la request y un **servicio** que permite acceder a él.

Ambos utilizan un servicio privado del propio módulo, que debe ser exportado para que al instanciar el interceptor en el `GlobalInterceptorModule`, el interceptor tenga acceso a él.

### AuthenticationModule
Módulo encarcado de la **autenticación del usuario** que realiza las acciones contra a API.

La autenticación se basa en **JWT** a través de la **cabecera Authorisation** y un **refresh token** a través de **cookies httpOnly**.

Este módulo dispone de un endpoint público para hacer login a través de **username** y **password**.

Tambien define el type `AuthUser`, importante en toda la aplicación para referir-se a la información del usuario autenticado. Esta información se obtiene a través de los interceptores del módulo en cualquier petición a un endpoint privado y se puede acceder a ella a través del decorador `@ReqUser()`.

Los interceptores del módulo que inyectan el `AuthUser` en la request son dos: `LocalAuthenticationInterceptor` y `JwtAuthenticationInterceptor`.

El primero es el que se usa en el endpoint público de login y realiza una petición a la base de datos para obtener la información a través de las credenciales.

El segundo se instancia de forma global y obtiene la información a través del payload del JWT en cualquier ruta que no esté marcada con el decorador `@Public()` de este mismo módulo. En caso de haber **expirado** dicho token, renueva los tokens a través del refresh token.

Para poder usar el refresh token, este debe:
1. Existir en la base de datos
2. No estar revocado
3. Ser vigente
4. Pertenecer al usuario del payload
5. Pertenecer al mismo dispositivo que el payload
6. No haberse usado

Si no se cumplen estas condiciones, se **denegará** el acceso.

Una vez **usado** el refresh token, se marca como tal en la base de datos.

Si se **incumplen** alguna de las últimas tres necesidades, además, por seguridad, se revocarian **todos** los tokens vigentes de los **usuarios implicados**, ya que implica una **manipulación** no autorizada de los tokens.

Cuando se **renuevan** los tokens al hacer una petición con un **JWT expirado** per con un **refresh token válido**, se sigue una estrategia __*silent refresh*__, donde se responde a la petición realizada de forma esperada y con éxito, pero con el nuevo **access token** en el header **Access-Token** y el nuevo **refresh token** en la cookie **refreshToken**.

Para toda la lógica pertinente al acceso y modificación de los refresh tokens, este módulo importa un submódulo llamado `RefreshTokenModule`.

### AuthorisationModule
Módulo encargado de comprobar los **permisos** de los **roles** de los usuarios para realizar **acciones** sobre **recursos**.

Este módulo dispone de una serie de **types** para definir los distintos **roles de los usuarios**, las **acciones a realizar** y los **permisos**.

`Permissions` type permite definir **recursos** y las **acciones** que se pueden realizar sobre estos. Normalmente los recursos suelen ser entidades del dominio sobre las que se puede actuar, o partials de ellas.

El módulo exporta un **servicio** con un **objeto** de configuración donde se definen los permisos que tiene cada **rol** sobre un **recurso** según la **acción** que se realiza.

Cada permiso del objeto de configuración se puede definir como un simple **boolean** o como una **función sincrona o asínrona** que retorne un booleano o una promesa de booleano. Estas funciones siempre tienen acceso al `AuthUser` y al recurso definido en el `Permissions` type. Con ellas se pueden hacer comprobaciones más precisas como por ejemplo, si el usuario autenticado es el owner del recurso.

Para comprobar que se tiene permiso para realizar la acción, el `AuthorisationService` expone un **método** al que se le debe de pasar el tipo de acción y el recurso sobre el que se actúa en caso de ser necesario una comprobación exhaustiva a través de las funciones de permiso definidas en el objeto de configuración mencionado anteriormente.

El método de comprobación extrae el `AuthUser` y la key del recurso sobre el que se quiere actuar del `ResourceModule`. Si no se tiene permiso se **lanzará una excepción**. Si se tiene permiso, se **marcará una flag** conforme los permisos se han comprobado.

Esta flag es útil para el **interceptor global** de este módulo (`PermissionsValidationInterceptor`), que sirve para evitar exponer endpoints privados sin que se hayan comprobado los permisos del usuario.

El **tipo de recurso** al que accederá el endpoint se debe **definir** a través del decorador de este mismo módulo `@AuthorisationResource(Resource)`. Se puede definir a nivel de clase o de handler.

Este módulo tambien dispone de una **función factory** que genera un **interceptor** según la acción (`CreatePermissionGuardInterceptor(Action)`). Útil principalmente cuando todos los permisos de esa acción, para ese tipo de recurso, en cada uno de los roles posibles, es un booleano y no una función, y por tanto no necesita obtener ningún recurso antes de realizar la comprobación de permisos.

### HealthCheckModule
Módulo encargado de exponer un **endpoint público** para comprobar si la api es **accesible**.

### UsersModule
Módulo encargado de gestionar la **entidad** `User`.

Por un lado, es **usado por otros módulos** de los que a su vez tambien depende, como `AuthenticationModule` o `AuthorisationModule`. Es por ello que hay que usar `forwardRef(() => Module)` para evitar dependencias circulares.

Por otro lado, **expone una serie de endpoints** para gestionar tanto las características del propio usuario que está accediendo a la api, como el resto de usuarios.

### TodosModule
Módulo encargado de gestionar la **entidad** `Todo`.

Expone una serie **endpoints** para gestionar los distintos registros de la entidad.

Este es el único módulo del proyecto que **no** formaria parte del **core** reaprovechable. Sirve de **boilerplate** para tener una referencia de como crear nuevos módulos con **controladores** y **entidades vinculadas** entre sí.

## Bruno
El proyecto contiene una carpeta de colección [Bruno](https://www.usebruno.com/) para probar la API.