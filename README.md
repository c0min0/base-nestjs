# NestJS Base
[Catalan](./docs/README.ca.md)
| [Spanish](./docs/README.es.md)

This project serves as a base implementation for common elements across different NestJS projects.

The project is divided into two sections:

* `src/common`: Contains constants and utilities shared across the application.
* `src/modules`: Contains the different feature modules of the application.

## Modules

### ConfigModule

Module responsible for importing **environment variables**.

Inside `src/common/constants` you’ll find the constants required to type the module configuration.

A sample environment file can be found in `.env.sample`.

Environment variables must be placed at the root of the project under the name `.env`.

Some variables can be omitted depending on the deployment environment, and they will take default values if not provided. Check the module implementation for more details.

### DatabaseModule

Module responsible for **configuring** and **connecting** to the **database**.

This module provides a `TransactionInterceptor` that can be applied at the class or handler level to handle the entire request under the same transaction. Along with it, thanks to the `@InjectTransactionalRepository(Entity)` decorator, you can obtain a repository of the entity defined in the decorator parameters, which will execute actions within the transaction established by the interceptor. This decorator is intended for use in service dependency injection.

### GlobalInterceptorsModule

Module responsible for **registering global interceptors** that are executed for every request in the application.

Thanks to this module, the application has a single global instantiation point for interceptors, making their **execution order** clear and straightforward.

### RequestContextModule

Module responsible for handling the **request context**.

It includes a **global interceptor** that sets the request context and a **service** that provides access to it.

Both rely on a private service within the module, which must be exported so that when the interceptor is instantiated in the `GlobalInterceptorModule`, it has access to it.

### AuthenticationModule

Module responsible for **user authentication** when interacting with the API.

Authentication is based on **JWT** via the **Authorization header** and a **refresh token** via **httpOnly cookies**.

This module provides a public endpoint to log in using **username** and **password**.

It also defines the `AuthUser` type, which is important across the application to reference the authenticated user’s information. This information is extracted by the module’s interceptors on any request to a private endpoint and can be accessed via the `@ReqUser()` decorator.

The interceptors that inject `AuthUser` into the request are:

* `LocalAuthenticationInterceptor`: Used in the public login endpoint. It queries the database to obtain user information based on credentials.
* `JwtAuthenticationInterceptor`: Instantiated globally. It extracts user information from the JWT payload on any route not marked with the `@Public()` decorator from this module. If the token has **expired**, it refreshes the tokens using the refresh token.

For the refresh token to be valid, it must:

1. Exist in the database
2. Not be revoked
3. Still be valid
4. Belong to the user in the payload
5. Belong to the same device as the payload
6. Not have been used before 

If these conditions are not met, access will be **denied**.

Once the refresh token has been **used**, it is marked as such in the database.

If any of the last three requirements are **not fulfilled**, additionally, for security reasons, **all** active tokens of the **involved users** will be revoked, as this implies an **unauthorized manipulation** of the tokens.

When tokens are **renewed** upon making a request with an **expired JWT** but a **valid refresh token**, the module follows a ***silent refresh*** strategy. The request is responded to successfully as expected, but with the new **access token** included in the **Access-Token** header and the new **refresh token** set in the **refreshToken** cookie.

All logic for handling and modifying refresh tokens is delegated to a submodule called `RefreshTokenModule`.

### AuthorisationModule

Module responsible for checking **role-based permissions** for users to perform **actions** on **resources**.

This module provides several **types** to define user **roles**, available **actions**, and **permissions**.

The `Permissions` type allows defining **resources** and the **actions** that can be performed on them. Typically, resources are domain entities or their partials.

The module exports a **service** with a **configuration object** that defines the permissions each **role** has on a **resource** depending on the **action**.

Each permission in the configuration object can be a simple **boolean** or a **synchronous/asynchronous function** returning a boolean or a promise of a boolean. These functions always have access to the `AuthUser` and the resource defined in the `Permissions` type. This allows for more precise checks, such as whether the authenticated user is the owner of the resource.

To check permissions, the `AuthorisationService` exposes a **method** that takes the action type and the resource (if required for detailed validation via permission functions defined in the configuration object).

This method extracts the `AuthUser` and the resource key (from the `ResourceModule`). If permission is denied, an **exception is thrown**. If granted, a **flag** is set indicating that permissions have been verified.

This flag is useful for the module’s **global interceptor** (`PermissionsValidationInterceptor`), which ensures that private endpoints are not exposed without first verifying user permissions.

The **resource type** that an endpoint will access must be **declared** using this module’s `@AuthorisationResource(Resource)` decorator, which can be applied at the class or handler level.

This module also provides a **factory function** that generates an **interceptor** based on actions (`CreatePermissionGuardInterceptor(Action)`). This is especially useful when all permissions for that action, for that resource type, across all roles are booleans (not functions), so there’s no need to fetch the resource before checking permissions.

### HealthCheckModule

Module responsible for exposing a **public endpoint** to verify whether the API is **reachable**.

### UsersModule

Module responsible for managing the `User` **entity**.

On one hand, it is **used by other modules**, such as `AuthenticationModule` and `AuthorisationModule`. For this reason, `forwardRef(() => Module)` must be used to avoid circular dependencies.

On the other hand, it **exposes several endpoints** to manage both the currently authenticated user’s details as well as other users.

### TodosModule

Module responsible for managing the `Todo` **entity**.

It exposes several **endpoints** to handle records of this entity.

This is the only module in the project that does **not** belong to the reusable **core**. Instead, it serves as **boilerplate**, providing a reference for how to create new modules with **controllers** and **entities linked** together.

## Bruno
The project contain a [Bruno](https://www.usebruno.com/) collection folder to test the API.