## Chapter 5: Refactoring with Confidence

Once you have a safety net of tests and have identified seams in your code, you can begin the actual refactoring process. AI can guide this process, suggest improvements, and help ensure that refactoring efforts provide maximum benefit with minimum risk.

### AI-Guided Refactoring Strategies

Refactoring legacy code requires a systematic approach. AI can help identify the most important refactoring opportunities and suggest the safest way to implement them.

#### Safe Refactoring Step Identification

AI can break down complex refactoring tasks into safe, incremental steps.

**AI Refactoring Plan Example**:
```
Refactoring Target: Large processOrder() method (247 lines, cyclomatic complexity: 23)

AI-Generated Refactoring Plan:

Step 1 (Risk: Low): Extract validation logic
- Extract order validation into validateOrder() method
- Estimated time: 2 hours
- Tests affected: 3 unit tests need updates

Step 2 (Risk: Low): Extract pricing calculation  
- Extract pricing logic into calculateOrderTotal() method
- Estimated time: 3 hours
- Tests affected: 5 unit tests need updates

Step 3 (Risk: Medium): Extract payment processing
- Extract payment logic into processPayment() method
- Estimated time: 4 hours
- Tests affected: 8 unit tests need updates
- External dependency: PaymentGateway interface

Step 4 (Risk: Medium): Extract inventory management
- Extract inventory updates into updateInventory() method
- Estimated time: 3 hours  
- Tests affected: 6 unit tests need updates
- Database schema dependency: inventory table

Step 5 (Risk: High): Break circular dependency with CustomerService
- Introduce OrderEventPublisher for customer notifications
- Estimated time: 8 hours
- Tests affected: 15 unit tests, 4 integration tests
- Requires coordination with CustomerService team

Total estimated effort: 20 hours over 2-3 sprints
```

#### Automated Code Smell Detection

AI can identify code smells that indicate refactoring opportunities.

**AI Code Smell Report**:
```
Code Smell Analysis Report:

Long Method (Critical):
- OrderProcessor.processOrder(): 247 lines (threshold: 50)
- CustomerService.updateCustomer(): 156 lines (threshold: 50)
- ReportGenerator.generateSalesReport(): 189 lines (threshold: 50)

Large Class (High):
- CustomerManager: 1,247 lines, 34 methods (threshold: 500 lines)
- OrderService: 892 lines, 28 methods (threshold: 500 lines)

Duplicate Code (High):
- Database connection logic duplicated in 23 files
- Error handling pattern repeated 47 times
- Date formatting logic duplicated in 15 files

Feature Envy (Medium):
- OrderService accesses CustomerService data 15 times
- ReportService accesses OrderService data 12 times

Data Class (Medium):
- CustomerData: only getters/setters, no behavior
- OrderInfo: only data, behavior in other classes

Shotgun Surgery (Medium):
- Adding new payment type requires changes in 8 files
- Adding new customer type requires changes in 12 files
```

#### Refactoring Impact Prediction

Before making changes, AI can predict the impact of refactoring efforts.

**Impact Analysis Example**:
```
Refactoring Impact Analysis: Extract PaymentProcessor Interface

Affected Components:
- OrderService (direct usage)
- PaymentService (implementation)
- RefundService (indirect usage)
- TestOrderProcessor (test double needed)

Risk Assessment:
- Low risk: Interface extraction is generally safe
- Medium risk: 23 existing tests will need updates
- High risk: Integration with external payment gateway

Benefits:
- Improved testability (can mock payment processing)
- Better separation of concerns
- Easier to add new payment methods
- Reduced coupling between order and payment logic

Recommended Approach:
1. Create PaymentProcessor interface
2. Update OrderService to use interface
3. Update all tests to use test doubles
4. Verify integration tests still pass
5. Extract concrete implementation
```

### Extract Method and Class Techniques

Two of the most common and valuable refactoring techniques are Extract Method and Extract Class. AI can help identify optimal extraction points and suggest good names and interfaces.

#### AI-Suggested Method Boundaries

AI can analyze long methods and suggest logical boundaries for extraction.

**Before Refactoring**:
```java
public void processOrder(Order order) {
    // Validation logic (20 lines)
    if (order == null) throw new IllegalArgumentException("Order cannot be null");
    if (order.getCustomerId() == null) throw new IllegalArgumentException("Customer ID required");
    if (order.getItems().isEmpty()) throw new IllegalArgumentException("Order must have items");
    
    for (OrderItem item : order.getItems()) {
        if (item.getQuantity() <= 0) throw new IllegalArgumentException("Invalid quantity");
        if (item.getProductId() == null) throw new IllegalArgumentException("Product ID required");
    }
    
    Customer customer = customerService.findById(order.getCustomerId());
    if (customer == null) throw new IllegalArgumentException("Customer not found");
    if (!customer.isActive()) throw new IllegalArgumentException("Customer account inactive");
    
    // Pricing calculation logic (35 lines)
    double subtotal = 0;
    for (OrderItem item : order.getItems()) {
        Product product = productService.findById(item.getProductId());
        double itemPrice = product.getPrice() * item.getQuantity();
        
        // Apply quantity discounts
        if (item.getQuantity() > 10) {
            itemPrice *= 0.95; // 5% discount
        } else if (item.getQuantity() > 5) {
            itemPrice *= 0.97; // 3% discount
        }
        
        subtotal += itemPrice;
    }
    
    // Apply customer tier discounts
    double discount = 0;
    if (customer.getTier() == CustomerTier.PREMIUM) {
        discount = subtotal * 0.15;
    } else if (customer.getTier() == CustomerTier.GOLD) {
        discount = subtotal * 0.10;
    } else if (customer.getTier() == CustomerTier.SILVER) {
        discount = subtotal * 0.05;
    }
    
    double tax = (subtotal - discount) * 0.08; // 8% tax rate
    double total = subtotal - discount + tax;
    order.setSubtotal(subtotal);
    order.setDiscount(discount);
    order.setTax(tax);
    order.setTotal(total);
    
    // Inventory check and update logic (25 lines)
    for (OrderItem item : order.getItems()) {
        InventoryItem inventory = inventoryService.findByProductId(item.getProductId());
        if (inventory.getAvailableQuantity() < item.getQuantity()) {
            throw new InsufficientInventoryException("Not enough inventory for " + item.getProductId());
        }
    }
    
    for (OrderItem item : order.getItems()) {
        inventoryService.reserveInventory(item.getProductId(), item.getQuantity());
    }
    
    // Payment processing logic (30 lines)
    PaymentInfo paymentInfo = order.getPaymentInfo();
    if (paymentInfo.getType() == PaymentType.CREDIT_CARD) {
        CreditCardPayment ccPayment = new CreditCardPayment();
        ccPayment.setCardNumber(paymentInfo.getCardNumber());
        ccPayment.setExpiryDate(paymentInfo.getExpiryDate());
        ccPayment.setCvv(paymentInfo.getCvv());
        ccPayment.setAmount(total);
        
        PaymentResult result = creditCardGateway.processPayment(ccPayment);
        if (!result.isSuccess()) {
            // Rollback inventory reservations
            for (OrderItem item : order.getItems()) {
                inventoryService.releaseReservation(item.getProductId(), item.getQuantity());
            }
            throw new PaymentFailedException("Payment failed: " + result.getErrorMessage());
        }
        order.setPaymentTransactionId(result.getTransactionId());
    }
    
    // Order persistence and notification logic (15 lines)
    order.setStatus(OrderStatus.CONFIRMED);
    order.setOrderDate(new Date());
    orderRepository.save(order);
    
    // Send confirmation email
    EmailTemplate template = emailService.getTemplate("order_confirmation");
    template.setVariable("customerName", customer.getName());
    template.setVariable("orderNumber", order.getOrderNumber());
    template.setVariable("orderTotal", String.format("$%.2f", total));
    emailService.sendEmail(customer.getEmail(), template);
    
    // Update customer loyalty points
    int pointsEarned = (int) (total / 10); // 1 point per $10 spent
    customerService.addLoyaltyPoints(customer.getId(), pointsEarned);
}
```

**AI-Suggested Method Extraction**:
```java
public void processOrder(Order order) {
    validateOrder(order);
    Customer customer = validateCustomer(order.getCustomerId());
    
    calculateOrderPricing(order, customer);
    reserveInventory(order);
    
    try {
        processPayment(order);
        finalizeOrder(order, customer);
    } catch (PaymentFailedException e) {
        rollbackInventoryReservations(order);
        throw e;
    }
}

private void validateOrder(Order order) {
    if (order == null) throw new IllegalArgumentException("Order cannot be null");
    if (order.getCustomerId() == null) throw new IllegalArgumentException("Customer ID required");
    if (order.getItems().isEmpty()) throw new IllegalArgumentException("Order must have items");
    
    for (OrderItem item : order.getItems()) {
        if (item.getQuantity() <= 0) throw new IllegalArgumentException("Invalid quantity");
        if (item.getProductId() == null) throw new IllegalArgumentException("Product ID required");
    }
}

private Customer validateCustomer(String customerId) {
    Customer customer = customerService.findById(customerId);
    if (customer == null) throw new IllegalArgumentException("Customer not found");
    if (!customer.isActive()) throw new IllegalArgumentException("Customer account inactive");
    return customer;
}

private void calculateOrderPricing(Order order, Customer customer) {
    double subtotal = calculateSubtotal(order);
    double discount = calculateDiscount(subtotal, customer);
    double tax = calculateTax(subtotal - discount);
    
    order.setSubtotal(subtotal);
    order.setDiscount(discount);
    order.setTax(tax);
    order.setTotal(subtotal - discount + tax);
}

private double calculateSubtotal(Order order) {
    double subtotal = 0;
    for (OrderItem item : order.getItems()) {
        Product product = productService.findById(item.getProductId());
        double itemPrice = product.getPrice() * item.getQuantity();
        itemPrice = applyQuantityDiscount(itemPrice, item.getQuantity());
        subtotal += itemPrice;
    }
    return subtotal;
}

private double applyQuantityDiscount(double itemPrice, int quantity) {
    if (quantity > 10) {
        return itemPrice * 0.95; // 5% discount
    } else if (quantity > 5) {
        return itemPrice * 0.97; // 3% discount
    }
    return itemPrice;
}

private double calculateDiscount(double subtotal, Customer customer) {
    switch (customer.getTier()) {
        case PREMIUM: return subtotal * 0.15;
        case GOLD: return subtotal * 0.10;
        case SILVER: return subtotal * 0.05;
        default: return 0;
    }
}

private double calculateTax(double taxableAmount) {
    return taxableAmount * 0.08; // 8% tax rate
}

private void reserveInventory(Order order) {
    // Check availability first
    for (OrderItem item : order.getItems()) {
        InventoryItem inventory = inventoryService.findByProductId(item.getProductId());
        if (inventory.getAvailableQuantity() < item.getQuantity()) {
            throw new InsufficientInventoryException("Not enough inventory for " + item.getProductId());
        }
    }
    
    // Reserve inventory
    for (OrderItem item : order.getItems()) {
        inventoryService.reserveInventory(item.getProductId(), item.getQuantity());
    }
}

private void processPayment(Order order) {
    PaymentInfo paymentInfo = order.getPaymentInfo();
    if (paymentInfo.getType() == PaymentType.CREDIT_CARD) {
        PaymentResult result = processCreditCardPayment(paymentInfo, order.getTotal());
        if (!result.isSuccess()) {
            throw new PaymentFailedException("Payment failed: " + result.getErrorMessage());
        }
        order.setPaymentTransactionId(result.getTransactionId());
    }
}

private PaymentResult processCreditCardPayment(PaymentInfo paymentInfo, double amount) {
    CreditCardPayment ccPayment = new CreditCardPayment();
    ccPayment.setCardNumber(paymentInfo.getCardNumber());
    ccPayment.setExpiryDate(paymentInfo.getExpiryDate());
    ccPayment.setCvv(paymentInfo.getCvv());
    ccPayment.setAmount(amount);
    
    return creditCardGateway.processPayment(ccPayment);
}

private void rollbackInventoryReservations(Order order) {
    for (OrderItem item : order.getItems()) {
        inventoryService.releaseReservation(item.getProductId(), item.getQuantity());
    }
}

private void finalizeOrder(Order order, Customer customer) {
    order.setStatus(OrderStatus.CONFIRMED);
    order.setOrderDate(new Date());
    orderRepository.save(order);
    
    sendOrderConfirmation(order, customer);
    updateCustomerLoyaltyPoints(customer, order.getTotal());
}

private void sendOrderConfirmation(Order order, Customer customer) {
    EmailTemplate template = emailService.getTemplate("order_confirmation");
    template.setVariable("customerName", customer.getName());
    template.setVariable("orderNumber", order.getOrderNumber());
    template.setVariable("orderTotal", String.format("$%.2f", order.getTotal()));
    emailService.sendEmail(customer.getEmail(), template);
}

private void updateCustomerLoyaltyPoints(Customer customer, double orderTotal) {
    int pointsEarned = (int) (orderTotal / 10); // 1 point per $10 spent
    customerService.addLoyaltyPoints(customer.getId(), pointsEarned);
}
```

#### Class Responsibility Analysis

AI can analyze classes to determine if they have too many responsibilities and suggest how to split them.

**AI Class Analysis Example**:
```
Class Analysis: CustomerManager

Current Responsibilities:
1. Customer data persistence (CRUD operations)
2. Customer authentication and authorization  
3. Customer communication (emails, notifications)
4. Loyalty program management
5. Customer reporting and analytics
6. Customer import/export functionality
7. Customer billing and payment history

Single Responsibility Principle Violations:
- Class has 7 distinct responsibilities
- 347 lines of code (recommended max: 200)
- 23 public methods (recommended max: 10)
- Dependencies on 12 different services

Suggested Decomposition:

1. CustomerRepository
   - Customer data persistence
   - Basic CRUD operations
   - Data validation

2. CustomerAuthenticationService  
   - Login/logout functionality
   - Password management
   - Session management

3. CustomerCommunicationService
   - Email notifications
   - SMS messaging  
   - Communication preferences

4. CustomerLoyaltyService
   - Points calculation
   - Reward redemption
   - Tier management

5. CustomerReportingService
   - Analytics and reporting
   - Data export functionality
   - Custom report generation

6. CustomerBillingService
   - Payment history
   - Billing address management
   - Invoice generation

Migration Strategy:
- Start with CustomerRepository (lowest risk, highest reuse)
- Move to CustomerCommunicationService (clear boundaries)
- Extract CustomerLoyaltyService (complex but isolated)
- Finish with authentication and billing (highest integration complexity)
```

#### Cohesion and Coupling Optimization

AI can suggest improvements to increase cohesion within classes and reduce coupling between classes.

**Cohesion Improvement Example**:
```java
// Low cohesion: Methods don't work together
public class OrderUtilities {
    public double calculateTax(double amount) { /* tax logic */ }
    public String formatCurrency(double amount) { /* formatting logic */ }
    public boolean isValidEmail(String email) { /* validation logic */ }
    public Date parseOrderDate(String dateString) { /* parsing logic */ }
    public void sendEmail(String to, String subject, String body) { /* email logic */ }
}

// AI-suggested high cohesion classes
public class TaxCalculator {
    private double taxRate;
    
    public double calculateTax(double amount) { /* tax logic */ }
    public double calculateTaxWithExemptions(double amount, List<TaxExemption> exemptions) { /* logic */ }
    public TaxBreakdown getDetailedTaxBreakdown(double amount) { /* logic */ }
}

public class CurrencyFormatter {
    private Locale locale;
    private Currency currency;
    
    public String formatAmount(double amount) { /* formatting logic */ }
    public String formatAmountWithSymbol(double amount) { /* formatting logic */ }
    public double parseAmount(String formattedAmount) { /* parsing logic */ }
}

public class EmailValidator {
    private List<String> validDomains;
    
    public boolean isValid(String email) { /* validation logic */ }
    public ValidationResult validateWithDetails(String email) { /* detailed validation */ }
    public List<String> extractEmailsFromText(String text) { /* extraction logic */ }
}
```

### Data Structure Modernization

Legacy systems often use outdated data structures and patterns. AI can help modernize these while maintaining backward compatibility.

#### Schema Evolution with AI Planning

AI can analyze database schemas and suggest modernization strategies.

**Database Schema Modernization Example**:
```sql
-- Legacy schema (problematic design)
CREATE TABLE customers (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    address TEXT,  -- Multiple address components in one field
    phone_numbers TEXT,  -- Multiple phones as comma-separated values
    preferences TEXT,  -- JSON blob without schema
    created_date VARCHAR(20),  -- Date stored as string
    status CHAR(1)  -- Cryptic status codes
);

-- AI-suggested modern schema
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status customer_status DEFAULT 'ACTIVE',
    version INTEGER DEFAULT 1  -- For optimistic locking
);

CREATE TYPE customer_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    address_type address_type_enum NOT NULL,
    street_line1 VARCHAR(100) NOT NULL,
    street_line2 VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    state_province VARCHAR(50),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    phone_type phone_type_enum NOT NULL,
    country_code VARCHAR(5) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    preference_category VARCHAR(50) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, preference_category, preference_key)
);
```

**AI Migration Strategy**:
```
Schema Migration Plan:

Phase 1: Add new tables alongside legacy table
- Create new normalized tables
- Add triggers to sync data during transition
- Implement dual-write pattern in application

Phase 2: Migrate application layer gradually  
- Update CustomerRepository to read from new tables
- Maintain writes to both old and new schemas
- Add comprehensive validation and reconciliation

Phase 3: Data migration and validation
- Migrate historical data with data quality checks
- Validate data consistency between old and new schemas
- Performance testing with production-like data volume

Phase 4: Switch to new schema
- Update application to read/write only new schema
- Remove dual-write logic
- Archive legacy table

Rollback Strategy:
- Keep legacy table for 30 days after migration
- Maintain data sync triggers for quick rollback
- Automated data consistency checks
```

#### Data Migration Strategy Development

AI can help develop comprehensive data migration strategies that minimize risk and downtime.

**AI-Generated Migration Plan**:
```java
// AI-suggested migration service
public class CustomerDataMigrator {
    private LegacyCustomerRepository legacyRepo;
    private ModernCustomerRepository modernRepo;
    private MigrationLogger logger;
    
    public MigrationResult migrateCustomers(MigrationConfig config) {
        MigrationResult result = new MigrationResult();
        
        try {
            List<LegacyCustomer> customers = legacyRepo.findBatch(
                config.getBatchSize(), 
                config.getStartId()
            );
            
            for (LegacyCustomer legacyCustomer : customers) {
                try {
                    ModernCustomer modernCustomer = transformCustomer(legacyCustomer);
                    validateModernCustomer(modernCustomer);
                    modernRepo.save(modernCustomer);
                    
                    result.incrementSuccessCount();
                    logger.logSuccess(legacyCustomer.getId(), modernCustomer.getId());
                    
                } catch (Exception e) {
                    result.incrementErrorCount();
                    logger.logError(legacyCustomer.getId(), e);
                    
                    if (config.isStopOnError()) {
                        break;
                    }
                }
            }
            
        } catch (Exception e) {
            result.setFatalError(e);
        }
        
        return result;
    }
    
    private ModernCustomer transformCustomer(LegacyCustomer legacy) {
        ModernCustomer modern = new ModernCustomer();
        
        // AI-identified transformation logic
        String[] nameParts = parseFullName(legacy.getName());
        modern.setFirstName(nameParts[0]);
        modern.setLastName(nameParts[1]);
        
        // Parse legacy address field
        List<Address> addresses = parseAddressField(legacy.getAddress());
        modern.setAddresses(addresses);
        
        // Parse comma-separated phone numbers
        List<PhoneNumber> phones = parsePhoneNumbers(legacy.getPhoneNumbers());
        modern.setPhoneNumbers(phones);
        
        // Convert legacy preferences JSON
        Map<String, Object> preferences = parsePreferences(legacy.getPreferences());
        modern.setPreferences(preferences);
        
        // Convert status codes
        CustomerStatus status = convertLegacyStatus(legacy.getStatus());
        modern.setStatus(status);
        
        return modern;
    }
}
```

#### API Contract Analysis and Updates

AI can analyze existing API contracts and suggest improvements for better design and backward compatibility.

**API Evolution Example**:
```java
// Legacy API (problematic design)
@RestController
public class CustomerController {
    
    @GetMapping("/customer/{id}")
    public String getCustomer(@PathVariable String id) {
        // Returns raw JSON string, no versioning, no error handling
        Customer customer = customerService.findById(id);
        return customer.toJson();
    }
    
    @PostMapping("/customer")
    public String createCustomer(@RequestBody String customerData) {
        // Accepts raw JSON string, no validation
        Customer customer = Customer.fromJson(customerData);
        customerService.save(customer);
        return "OK";
    }
}

// AI-suggested modern API
@RestController
@RequestMapping("/api/v2/customers")
public class CustomerApiController {
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomer(
            @PathVariable @Valid UUID id,
            @RequestHeader(value = "API-Version", defaultValue = "2.0") String apiVersion) {
        
        try {
            Customer customer = customerService.findById(id);
            if (customer == null) {
                return ResponseEntity.notFound().build();
            }
            
            CustomerDto dto = customerMapper.toDto(customer, apiVersion);
            ApiResponse<CustomerDto> response = ApiResponse.success(dto);
            
            return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES))
                .body(response);
                
        } catch (Exception e) {
            logger.error("Error retrieving customer {}", id, e);
            ApiResponse<CustomerDto> errorResponse = ApiResponse.error(
                "CUSTOMER_RETRIEVAL_ERROR", 
                "Unable to retrieve customer"
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(
            @RequestBody @Valid CreateCustomerRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        
        try {
            // Check for duplicate requests
            if (idempotencyKey != null && idempotencyService.isDuplicate(idempotencyKey)) {
                CustomerDto existing = idempotencyService.getResult(idempotencyKey);
                return ResponseEntity.ok(ApiResponse.success(existing));
            }
            
            Customer customer = customerMapper.fromCreateRequest(request);
            customer = customerService.create(customer);
            
            CustomerDto dto = customerMapper.toDto(customer, "2.0");
            ApiResponse<CustomerDto> response = ApiResponse.success(dto);
            
            if (idempotencyKey != null) {
                idempotencyService.store(idempotencyKey, dto);
            }
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .location(URI.create("/api/v2/customers/" + customer.getId()))
                .body(response);
                
        } catch (ValidationException e) {
            ApiResponse<CustomerDto> errorResponse = ApiResponse.validationError(e.getErrors());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error creating customer", e);
            ApiResponse<CustomerDto> errorResponse = ApiResponse.error(
                "CUSTOMER_CREATION_ERROR", 
                "Unable to create customer"
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
}

// AI-suggested backward compatibility layer
@RestController
@RequestMapping("/customer")  // Legacy endpoint
@Deprecated
public class LegacyCustomerController {
    
    private CustomerApiController modernController;
    private LegacyResponseMapper legacyMapper;
    
    @GetMapping("/{id}")
    public String getCustomer(@PathVariable String id) {
        // Delegate to modern controller and transform response
        try {
            UUID customerId = UUID.fromString(id);
            ResponseEntity<ApiResponse<CustomerDto>> response = 
                modernController.getCustomer(customerId, "1.0");
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return legacyMapper.toJsonString(response.getBody().getData());
            } else {
                return "ERROR";
            }
        } catch (Exception e) {
            return "ERROR";
        }
    }
}
```

This completes Part II of the book, which focuses on safe transformation techniques. The content provides practical, AI-enhanced approaches to testing, dependency breaking, and refactoring legacy code. Each technique is presented with real-world examples and specific AI prompts that teams can adapt for their own situations.

The progression from establishing safety nets through testing, to breaking dependencies, and finally to confident refactoring creates a systematic approach that minimizes risk while maximizing the benefits of modernization efforts.

Would you like me to continue with Part III (Strategic Modernization), or would you prefer to refine any aspects of Part II?