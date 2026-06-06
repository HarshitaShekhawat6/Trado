if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/anju/.gradle/caches/9.3.1/transforms/8c4a8e4f1b1bd9059e54ea9e10beebf7/transformed/hermes-android-250829098.0.10-release/prefab/modules/hermesvm/libs/android.arm64-v8a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/anju/.gradle/caches/9.3.1/transforms/8c4a8e4f1b1bd9059e54ea9e10beebf7/transformed/hermes-android-250829098.0.10-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

