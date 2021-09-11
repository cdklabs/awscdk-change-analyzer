# Versioning and Release

AWS C2A is **experimental**, so our versioning structure is still scrappy. Currently,
all releases should exist within the `0.x.y` range to maintain semver.

## Releases

You can trigger a release two ways:

1. Release a new version for all packages:
    ```
    yarn tag:all
    ```
2. Release a new version for all changed packages:
    ```
    yarn tag:changed
    ```

**Note**: Minor releases should occur across all packages. 
