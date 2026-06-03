/// <reference types="@tarojs/taro" />

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.svg'
declare module '*.scss'

declare const defineAppConfig: (config: Taro.Config) => Taro.Config
declare const definePageConfig: (config: Taro.Config) => Taro.Config
