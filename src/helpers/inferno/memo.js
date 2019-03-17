import shallowEqualObjects from 'shallow-equal/objects';

export default function memo(Component) {
  Component.defaultHooks = {
    // Memoize the component render result
    onComponentShouldUpdate(prevProps, nextProps) {
      return !shallowEqualObjects(prevProps, nextProps);
    }
  };

  return Component;
}
