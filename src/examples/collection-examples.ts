import { Observable, of, from, BehaviorSubject } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import {
  CollectionInput,
  InteropCollection,
  InteropAdvancedCollection,
  createInteropCollection,
  normalizeCollection,
  createUniversalTrackBy,
  mergeCollections,
  InteropCollectionAdapter
} from '../types';

/**
 * Comprehensive examples demonstrating the interoperability ethos in action.
 * These examples show how the same component interface can work with
 * radically different data sources without any conversion overhead.
 */

// Sample data types for examples
interface User {
  id: number;
  name: string;
  email: string;
  department?: string;
}

interface Product {
  sku: string;
  title: string;
  price: number;
  category: string;
  inStock: boolean;
}

/**
 * EXAMPLE 1: Basic Interoperability
 * The same component can accept data from any source
 */
export class BasicInteroperabilityExamples {

  // Static array - most common case
  static arrayExample(): CollectionInput<string> {
    return ['Apple', 'Banana', 'Cherry', 'Date'];
  }

  // Observable from HTTP service
  static httpExample(): CollectionInput<User> {
    // Simulated HTTP response
    return of([
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
      { id: 3, name: 'Carol Davis', email: 'carol@example.com' }
    ]).pipe(delay(1000)); // Simulate network delay
  }

  // Promise from fetch API
  static fetchExample(): CollectionInput<Product> {
    return Promise.resolve([
      { sku: 'ABC123', title: 'Wireless Headphones', price: 99.99, category: 'Electronics', inStock: true },
      { sku: 'DEF456', title: 'Coffee Mug', price: 12.99, category: 'Home', inStock: true },
      { sku: 'GHI789', title: 'Notebook', price: 5.99, category: 'Office', inStock: false }
    ]);
  }

  // Set collection (unique items)
  static setExample(): CollectionInput<number> {
    return new Set([1, 2, 3, 4, 5, 2, 3]); // Duplicates automatically removed
  }

  // Map values as collection
  static mapExample(): CollectionInput<string> {
    const statusMap = new Map([
      ['active', 'Active Users'],
      ['inactive', 'Inactive Users'],
      ['pending', 'Pending Users']
    ]);
    return Array.from(statusMap.values());
  }

  // Generator function
  static generatorExample(): CollectionInput<number> {
    function* fibonacci() {
      let [a, b] = [0, 1];
      while (a < 100) {
        yield a;
        [a, b] = [b, a + b];
      }
    }
    return fibonacci();
  }

  // NodeList from DOM (for Angular components that work with DOM elements)
  static domExample(): CollectionInput<Element> {
    // In a real Angular app, this might come from ViewChildren or ElementRef
    return document.querySelectorAll('.collection-item');
  }
}

/**
 * EXAMPLE 2: Real-World Component Integration
 * Shows how Angular components would use these collections
 */
export class ComponentIntegrationExamples {

  /**
   * A typical Angular service that can return data in multiple formats
   */
  static createUserService() {
    return {
      // Traditional approach - returns Observable<User[]>
      getUsers(): Observable<User[]> {
        return of([
          { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Design' }
        ]);
      },

      // Modern approach - returns Promise<User[]>
      async getUsersAsync(): Promise<User[]> {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
          { id: 3, name: 'Mike Johnson', email: 'mike@example.com', department: 'Marketing' },
          { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', department: 'Sales' }
        ];
      },

      // Cached approach - returns User[]
      getCachedUsers(): User[] {
        return [
          { id: 5, name: 'Tom Brown', email: 'tom@example.com', department: 'Support' }
        ];
      },

      // Real-time approach - returns BehaviorSubject<User[]>
      getUsersRealtime(): BehaviorSubject<User[]> {
        const subject = new BehaviorSubject<User[]>([]);

        // Simulate real-time updates
        setTimeout(() => {
          subject.next([
            { id: 6, name: 'Lisa Garcia', email: 'lisa@example.com', department: 'HR' }
          ]);
        }, 1000);

        return subject;
      }
    };
  }

  /**
   * Component that accepts any of these data sources seamlessly
   */
  static createFlexibleComponent() {
    return {
      // The component input accepts ANY collection format
      users: null as CollectionInput<User> | null,

      // Internal normalized observable for template binding
      users$: null as Observable<User[]> | null,

      // Method to set users from any source
      setUsers(users: CollectionInput<User>) {
        this.users = users;
        this.users$ = normalizeCollection(users);
      },

      // Usage examples:
      useStaticArray() {
        this.setUsers([
          { id: 1, name: 'Static User', email: 'static@example.com' }
        ]);
      },

      useObservable() {
        const userService = ComponentIntegrationExamples.createUserService();
        this.setUsers(userService.getUsers());
      },

      usePromise() {
        const userService = ComponentIntegrationExamples.createUserService();
        this.setUsers(userService.getUsersAsync());
      },

      useCached() {
        const userService = ComponentIntegrationExamples.createUserService();
        this.setUsers(userService.getCachedUsers());
      },

      useRealtime() {
        const userService = ComponentIntegrationExamples.createUserService();
        this.setUsers(userService.getUsersRealtime());
      }
    };
  }
}

/**
 * EXAMPLE 3: Advanced Features with Full Interoperability
 * Demonstrates pagination, filtering, and sorting across different data sources
 */
export class AdvancedInteroperabilityExamples {

  /**
   * Create a paginated collection that works with any data source
   */
  static createPaginatedCollection<T>(
    source: CollectionInput<T>,
    pageSize: number = 10
  ): InteropAdvancedCollection<T> {
    return {
      items: normalizeCollection(source),
      pagination: {
        current: 1,
        size: pageSize,
        total: 0, // Would be calculated based on source
        hasMore: true
      },
      trackBy: createUniversalTrackBy('id'),

      loadMore: () => {
        // Implementation would depend on the source type
        console.log('Loading more items...');
      }
    };
  }

  /**
   * Create a searchable collection from any source
   */
  static createSearchableCollection<T>(
    source: CollectionInput<T>,
    searchFields: (keyof T)[]
  ): InteropAdvancedCollection<T> {
    const searchTerm$ = new BehaviorSubject<string>('');

    return {
      items: normalizeCollection(source).pipe(
        map(items => items.filter(item => {
          const term = searchTerm$.value.toLowerCase();
          if (!term) return true;

          return searchFields.some(field => {
            const value = item[field];
            return value && String(value).toLowerCase().includes(term);
          });
        }))
      ),

      searchTerm: '',
      onSearch: (term: string) => {
        searchTerm$.next(term);
      },

      trackBy: createUniversalTrackBy('id')
    };
  }

  /**
   * Merge collections from multiple sources
   */
  static createMergedCollection(): Observable<User[]> {
    const userService = ComponentIntegrationExamples.createUserService();

    return mergeCollections(
      userService.getUsers(),           // Observable source
      userService.getUsersAsync(),      // Promise source
      userService.getCachedUsers(),     // Array source
      userService.getUsersRealtime()    // BehaviorSubject source
    );
  }

  /**
   * Transform collections on the fly
   */
  static createTransformedCollection(): InteropCollection<User> {
    // Raw data might come in different formats from different APIs
    const rawApiData = [
      { user_id: 1, full_name: 'John Doe', email_address: 'john@example.com' },
      { user_id: 2, full_name: 'Jane Smith', email_address: 'jane@example.com' }
    ];

    return createInteropCollection(rawApiData, {
      // Transform function normalizes different API formats
      transform: (raw: any): User => ({
        id: raw.user_id || raw.id,
        name: raw.full_name || raw.name,
        email: raw.email_address || raw.email,
        department: raw.dept || raw.department
      }),
      trackBy: createUniversalTrackBy('id')
    });
  }
}

/**
 * EXAMPLE 4: Migration and Legacy Support
 * Shows how existing Angular code can adopt Interop collections gradually
 */
export class MigrationExamples {

  /**
   * Legacy component using traditional Angular patterns
   */
  static legacyComponent() {
    return {
      users: [] as User[],
      loading: false,

      // Old way - manual subscription management
      loadUsers() {
        this.loading = true;
        // Simulate HTTP call
        setTimeout(() => {
          this.users = [
            { id: 1, name: 'Legacy User', email: 'legacy@example.com' }
          ];
          this.loading = false;
        }, 1000);
      }
    };
  }

  /**
   * Modernized component using Interop collections
   */
  static modernComponent() {
    const adapter = new InteropCollectionAdapter<User>();

    return {
      // Modern way - reactive collections with built-in state management
      collection: adapter.collection,

      // Simple methods that work with any data source
      loadUsers(source: CollectionInput<User>) {
        normalizeCollection(source).subscribe(users => {
          adapter.updateItems(users);
        });
      },

      addUser(user: User) {
        adapter.addItem(user);
      },

      removeUser(id: number) {
        adapter.removeItem(user => user.id === id);
      }
    };
  }

  /**
   * Bridge pattern for gradual migration
   */
  static createMigrationBridge() {
    return {
      // Accepts both old and new patterns
      setData(data: User[] | CollectionInput<User>) {
        if (Array.isArray(data)) {
          // Legacy array format
          return of(data);
        } else {
          // Modern collection format
          return normalizeCollection(data);
        }
      }
    };
  }
}

/**
 * EXAMPLE 5: Performance and Optimization
 * Shows how interop collections maintain performance across different scenarios
 */
export class PerformanceExamples {

  /**
   * Large dataset handling with virtual scrolling support
   */
  static createLargeDataset(): InteropCollection<number> {
    // Simulate a large dataset that might come from various sources
    const largeArray = Array.from({ length: 100000 }, (_, i) => i);

    return createInteropCollection(largeArray, {
      trackBy: createUniversalTrackBy(), // Use index-based tracking for performance
      config: {
        performance: {
          virtualScroll: true,
          lazy: true
        }
      }
    });
  }

  /**
   * Real-time data with debouncing
   */
  static createRealtimeCollection(): Observable<string[]> {
    // Simulate high-frequency updates (like WebSocket data)
    const updates$ = new BehaviorSubject<string[]>(['initial']);

    // Simulate rapid updates
    setInterval(() => {
      const current = updates$.value;
      updates$.next([...current, `Update ${Date.now()}`]);
    }, 100);

    return normalizeCollection(updates$);
  }
}

/**
 * Usage demonstration - how these examples would be used in practice
 */
export function demonstrateUsage() {
  console.log('=== Interop Collection Examples ===');

  // Basic interoperability
  const arrays = BasicInteroperabilityExamples.arrayExample();
  const users$ = BasicInteroperabilityExamples.httpExample();
  const products = BasicInteroperabilityExamples.fetchExample();

  console.log('Arrays:', arrays);
  console.log('Users Observable:', users$);
  console.log('Products Promise:', products);

  // Component integration
  const component = ComponentIntegrationExamples.createFlexibleComponent();
  component.useStaticArray();
  component.useObservable();

  // Advanced features
  const searchable = AdvancedInteroperabilityExamples.createSearchableCollection(
    users$,
    ['name', 'email']
  );

  const merged$ = AdvancedInteroperabilityExamples.createMergedCollection();

  console.log('Searchable collection:', searchable);
  console.log('Merged collections:', merged$);

  // Migration support
  const modern = MigrationExamples.modernComponent();
  modern.loadUsers(['user1', 'user2'] as any);

  console.log('=== All examples demonstrate seamless interoperability ===');
}
