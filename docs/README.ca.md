# NestJS Base
[Anglès](../README.md)
| [Castellà](./README.es.md)

Aquest projecte és una base que serveix com a implementació de tot allò comú a diferents projectes de NestJS.

El projecte es divideix en dos apartats:

* `src/common`: On es troben les constants i utilitats transversals a l’aplicació.
* `src/modules`: On hi ha els diferents mòduls de funcionalitat de l’aplicació.

## Mòduls

### ConfigModule

Mòdul encarregat d’importar les **variables d’entorn**.

Dins de `src/common/constants` es troben les constants necessàries per tipar la configuració del mòdul.

A `.env.sample` es troba un exemple de fitxer de variables d’entorn.

Les variables d’entorn han d’anar a l’arrel del projecte sota el nom de `.env`.

Hi ha variables que poden ser omitides segons l’entorn de desplegament i que prenen valors per defecte en cas d’ometre’s. Consulta la implementació del mòdul per a més informació.

### DatabaseModule

Mòdul encarregat de la **configuració** i **connexió** amb la **base de dades**.

Aquest mòdul disposa d’un `TransactionInterceptor` que es pot usar a nivell de classe o *handler* per gestionar tota la request sota la mateixa transacció. Juntament amb ell, gràcies al decorador `@InjectTransactionalRepository(Entity)` es pot obtenir un repositori de l’entitat definida als paràmetres del decorador, que realitzi les accions dins de la transacció establerta per l’interceptor. Aquest decorador està pensat per usar-se a la injecció de dependències dels serveis.

### GlobalInterceptorsModule

Mòdul encarregat de **registrar interceptors globals** que s’executen a totes les *requests* de l’aplicació.

Gràcies a aquest mòdul, l’aplicació disposa d’un únic punt d’instanciació global per als interceptors, essent així clar i senzill l’**ordre d’execució** d’aquests.

### RequestContextModule

Mòdul encarregat de gestionar el **context de la request**.

Conté un **interceptor global** que estableix el context de la request i un **servei** que permet accedir-hi.

Ambdós utilitzen un servei privat del mateix mòdul, que ha de ser exportat perquè en instanciar l’interceptor al `GlobalInterceptorModule`, l’interceptor hi tingui accés.

### AuthenticationModule

Mòdul encarregat de l’**autenticació de l’usuari** que realitza les accions contra l’API.

L’autenticació es basa en **JWT** a través de la **capçalera Authorisation** i un **refresh token** a través de **cookies httpOnly**.

Aquest mòdul disposa d’un *endpoint* públic per fer login a través de **username** i **password**.

També defineix el tipus `AuthUser`, important a tota l’aplicació per referir-se a la informació de l’usuari autenticat. Aquesta informació s’obté a través dels interceptors del mòdul en qualsevol petició a un *endpoint* privat i s’hi pot accedir a través del decorador `@ReqUser()`.

Els interceptors del mòdul que injecten l’`AuthUser` a la request són dos: `LocalAuthenticationInterceptor` i `JwtAuthenticationInterceptor`.

El primer és el que s’usa a l’*endpoint* públic de login i realitza una petició a la base de dades per obtenir la informació a través de les credencials.

El segon s’instancia de forma global i obté la informació a través del *payload* del JWT en qualsevol ruta que no estigui marcada amb el decorador `@Public()` d’aquest mateix mòdul. En cas que hagi **expirat** aquest token, renova els tokens a través del refresh token.

Per poder usar el refresh token, aquest ha de:
1. Existir a la base de dades
2. No estar revocat
3. Ser vigent
4. Pertànyer a l’usuari del payload
5. Pertànyer al mateix dispositiu que el payload
6. No haver-se usat

Si no es compleixen aquestes condicions, es **denegarà** l’accés.

Un cop **usat** el refresh token, es marca com a tal a la base de dades.

Si es **incumpleixen** alguna de les últimes tres condicions, a més, per seguretat, es revocarien **tots** els tokens vigents dels **usuaris implicats**, ja que implica una **manipulació** no autoritzada dels tokens.

Quan es **renoven** els tokens en fer una petició amb un **JWT expirat** però amb un **refresh token vàlid**, se segueix una estratègia de ***silent refresh***, on es respon a la petició realitzada de forma esperada i amb èxit, però amb el nou **access token** a la capçalera **Access-Token** i el nou **refresh token** a la cookie **refreshToken**.

Per a tota la lògica pertinent a l’accés i modificació dels refresh tokens, aquest mòdul importa un submòdul anomenat `RefreshTokenModule`.

### AuthorisationModule

Mòdul encarregat de comprovar els **permisos** dels **rols** dels usuaris per realitzar **accions** sobre **recursos**.

Aquest mòdul disposa d’una sèrie de **tipus** per definir els diferents **rols dels usuaris**, les **accions a realitzar** i els **permisos**.

El tipus `Permissions` permet definir **recursos** i les **accions** que es poden realitzar sobre aquests. Normalment els recursos solen ser entitats del domini sobre les quals es pot actuar, o partials d’aquestes.

El mòdul exporta un **servei** amb un **objecte** de configuració on es defineixen els permisos que té cada **rol** sobre un **recurs** segons l’**acció** que es realitza.

Cada permís de l’objecte de configuració es pot definir com un simple **boolean** o com una **funció síncrona o asíncrona** que retorni un booleà o una promesa de booleà. Aquestes funcions sempre tenen accés a l’`AuthUser` i al recurs definit al tipus `Permissions`. Amb elles es poden fer comprovacions més precises com, per exemple, si l’usuari autenticat és l’*owner* del recurs.

Per comprovar que es té permís per realitzar l’acció, l’`AuthorisationService` exposa un **mètode** al qual se li ha de passar el tipus d’acció i el recurs sobre el qual s’actua en cas que sigui necessària una comprovació exhaustiva a través de les funcions de permís definides a l’objecte de configuració esmentat anteriorment.

El mètode de comprovació extreu l’`AuthUser` i la *key* del recurs sobre el qual es vol actuar del `ResourceModule`. Si no es té permís es **llençarà una excepció**. Si es té permís, es **marcarà una flag** conforme els permisos s’han comprovat.

Aquesta *flag* és útil per a l’**interceptor global** d’aquest mòdul (`PermissionsValidationInterceptor`), que serveix per evitar exposar *endpoints* privats sense que s’hagin comprovat els permisos de l’usuari.

El **tipus de recurs** al qual accedirà l’*endpoint* s’ha de **definir** a través del decorador d’aquest mateix mòdul `@AuthorisationResource(Resource)`. Es pot definir a nivell de classe o de *handler*.

Aquest mòdul també disposa d’una **funció *factory*** que genera un **interceptor** segons l’acció (`CreatePermissionGuardInterceptor(Action)`). Útil principalment quan tots els permisos d’aquesta acció, per a aquest tipus de recurs, en cadascun dels rols possibles, és un booleà i no una funció, i per tant no necessita obtenir cap recurs abans de realitzar la comprovació de permisos.

### HealthCheckModule

Mòdul encarregat d’exposar un **endpoint públic** per comprovar si l’API és **accessible**.

### UsersModule

Mòdul encarregat de gestionar l’**entitat** `User`.

D’una banda, és **usat per altres mòduls** dels quals alhora també depèn, com `AuthenticationModule` o `AuthorisationModule`. És per això que cal usar `forwardRef(() => Module)` per evitar dependències circulars.

D’altra banda, **exposa una sèrie d’*endpoints*** per gestionar tant les característiques del propi usuari que està accedint a l’API, com la resta d’usuaris.

### TodosModule

Mòdul encarregat de gestionar l’**entitat** `Todo`.

Exposa una sèrie d’**endpoints** per gestionar els diferents registres de l’entitat.

Aquest és l’únic mòdul del projecte que **no** formaria part del **core** reutilitzable. Serveix de **boilerplate** per tenir una referència de com crear nous mòduls amb **controladors** i **entitats vinculades** entre si.

## Bruno
El projecte conté una carpeta de col·lecció [Bruno](https://www.usebruno.com/) per provar l'API.