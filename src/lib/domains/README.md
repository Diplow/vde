# Domains

A domain is a modelisation of a business environment.

## Entities

Entities are a modelisation of the domain's data.

## Actions

Actions are a modelisation of the domain's business logic. If you look at the actions of a domain, you should get an exhaustive list of what can be done in the domain.

## Services

Services are the entry point for the domain. APIs will call the services of a domain to get or modify data. Services can also call actions of their own domain and use repositories (given as a prop) to persist data.

## Repositories

Repositories are pure interfaces that define the data access layer for the domain. They are implemented by the domain's infrastructure layer.
